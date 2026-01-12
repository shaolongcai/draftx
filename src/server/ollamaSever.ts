import { ChildProcess } from 'child_process';
import * as path from 'path';
import { logger } from '../core/logger.js';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { getConfig } from '../database/sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OllamaService {
    private process: ChildProcess | null = null;
    private isRunning = false;
    private aiWorker: Worker | null = null;
    private pendingAiRequests: Map<string, { resolve: Function; reject: Function, params: GenerateRequest, onStream?: (chunk: { content: string, type: 'stream' | 'done' }) => void }>
    private isProcessingQueue = false; // 用于标记是否正在处理队列中的请求


    constructor() {
        this.pendingAiRequests = new Map()
        this.initializeAiWorker()
    }


    //AI线程初始化
    private initializeAiWorker() {
        try {
            this.aiWorker = new Worker(path.join(__dirname, '../workers/ai.worker.js'));

            // 从数据库获取 Ollama 配置并发送给 Worker
            const aiProvider = getConfig('ai_provider')
            const host = JSON.parse(aiProvider).host
            const model = JSON.parse(aiProvider).model

            //初始化请求
            this.aiWorker.postMessage({
                type: 'init',
                config: { host, model }
            });

            // 监听Worker消息
            this.aiWorker.on('message', (response: any) => {
                const { requestId, type, chunk, success, result, error } = response;
                const pending = this.pendingAiRequests.get(requestId);

                if (!pending) return;

                // 处理流式数据块
                if (type === 'stream' && chunk) {
                    logger.info(`chunk:${chunk}`)
                    const chunkData = {
                        content: chunk,
                        type: 'stream' as 'stream',
                    }
                    if (pending.onStream) {
                        pending.onStream(chunkData);
                    }
                    return;
                }

                // 处理最终响应
                if (success !== undefined) {
                    this.pendingAiRequests.delete(requestId);
                    this.isProcessingQueue = false;
                    if (success) {
                        // 返回结束标识符
                        const doneData = {
                            content: '',
                            type: 'done' as 'done',
                        }
                        if (pending.onStream) {
                            pending.onStream(doneData);
                        }
                        pending.resolve(result);
                    } else {
                        pending.reject(new Error(error));
                    }
                }
            });

            // 监听Worker错误
            this.aiWorker.on('error', (error) => {
                console.error(`AI处理Worker错误: ${error.message}`);
                // restartImageWorker();
            });

            // 监听Worker退出
            this.aiWorker.on('exit', (code) => {
                if (code !== 0) {
                    console.warn(`AI处理Worker异常退出，代码: ${code}`);
                    // restartImageWorker();
                }
            });
        } catch (error) {
            console.error(`初始化AI处理Worker失败: ${error}`);
        }
    }


    // 处理队列中的请求
    private async handleQueue() {
        if (this.pendingAiRequests.size === 0) return
        // 处理队列中的第一个请求
        const firstRequestId = this.pendingAiRequests.keys().next().value;
        const firstItem = this.pendingAiRequests.get(firstRequestId)!;
        const { params, reject } = firstItem;
        try {
            if (this.isProcessingQueue) {
                return;
            }

            logger.info(`处理队列中的请求: ${JSON.stringify(params)}`);
            this.isProcessingQueue = true; // 标记为正在处理队列中的请求

            // 发送任务到Worker
            this.aiWorker.postMessage({
                path: params.path,
                prompt: params.prompt,
                content: params.content.slice(0, 4000), //只存入前4000字
                isImage: params.isImage,
                isJson: params.isJson,
                jsonFormat: params.jsonFormat,
                requestId: firstRequestId
            });

        } catch (error) {
            logger.error(`处理队列中的请求失败: ${firstRequestId},error:${error}`);
            this.isProcessingQueue = false;
            reject(error);

        } finally {
            setTimeout(() => {
                // 处理完第一个请求后，递归调用处理队列(相隔一段时间等待)
                this.handleQueue(); //或者可以改成while循环
            }, 1000);
        }
    }

    // 使用线程生成文本
    public async generate(params: GenerateRequest, onStream?: (chunk: { content: string, type: 'stream' | 'done' }) => void): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.aiWorker) {
                reject(new Error('文档处理Worker未初始化'));
                return;
            }
            const requestId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // 添加到请求队列中
            this.pendingAiRequests.set(requestId, { resolve, reject, params, onStream });
            if (!this.isProcessingQueue) {
                this.handleQueue();
            }
        });
    }

    // 检查ollama服务是否可用,尝试5次，2秒超时
    public async checkOllamaServer(host: string, modelID: string): Promise<boolean> {
        for (let i = 0; i < 5; i++) {
            try {
                const response = await fetch(`${host}/api/tags`);
                // 解析并检查返回的模型列表
                if (response.ok) {
                    const data = await response.json();
                    if (data.models && Array.isArray(data.models) && data.models.length > 0) {
                        logger.info(`已发现可用模型:${data.models.map((m: any) => m.name).join(', ')}`);
                        // 检查返回的模型列表中是否包含指定的 modelID
                        const hasModel = data.models.some((m: any) => m.name === modelID);
                        if (hasModel) {
                            logger.info(`已发现指定模型: ${modelID}`);
                            return true
                        } else {
                            throw new Error(`Specified model not found: ${modelID}`); //统一交给catch处理
                        }
                        // return true;
                    } else {
                        logger.warn('Ollama服务未配置任何模型');
                        throw new Error('Ollama server has no models configured'); //统一交给catch处理
                    }
                }
                // if (response.ok) return true;
            } catch (error) {
                throw new Error(`${error} , Please check the host or modelID.`); //统一交给catch处理
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('Check Ollama server timeout');
    }

    // 重启 Worker
    // private restartImageWorker(): void {
    //     try {
    //         // 清理所有待处理的请求
    //         for (const [requestId, pending] of this.pendingRequests) {
    //             pending.reject(new Error('Worker重启，请求被取消'));
    //         }
    //         this.pendingRequests.clear();

    //         // 关闭旧的Worker
    //         if (this.imageWorker) {
    //             this.imageWorker.terminate();
    //             this.imageWorker = null;
    //         }

    //         // 重新初始化Worker
    //         setTimeout(() => {
    //             this.initializeImageWorker();
    //         }, 1000); // 延迟1秒重启

    //     } catch (error) {
    //         // logger.error(`重启图像处理 Worker 失败: ${error}`);
    //     }
    // }



}

export const ollamaService = new OllamaService(); //单例模式，永远都是同一个实例
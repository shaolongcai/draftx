import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { logger } from '../core/logger.js';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OllamaService {
    private process: ChildProcess | null = null;
    private isRunning = false;
    private aiWorker: Worker | null = null;
    private pendingAiRequests: Map<string, { resolve: Function; reject: Function, params: GenerateRequest }>
    private isProcessingQueue = false; // 用于标记是否正在处理队列中的请求


    constructor() {
        this.pendingAiRequests = new Map()
        // this.initializeAiWorker()
    }


    //AI线程初始化
    private initializeAiWorker() {
        try {
            this.aiWorker = new Worker(path.join(__dirname, '../workers/ai.worker.js'));

            // 监听Worker消息
            this.aiWorker.on('message', (response: any) => {
                const { requestId, success, result, error, needRestartOllama } = response;
                const pending = this.pendingAiRequests.get(requestId);

                if (pending) {
                    this.pendingAiRequests.delete(requestId);
                    this.isProcessingQueue = false;
                    if (success) {
                        pending.resolve(result);
                    } else {
                        pending.reject(new Error(error)); //这里reject到file.ts 然后报错

                        // 暂时废弃
                        // if (needRestartOllama) {
                        //     // this.restartOllamaService(pending, error);
                        //     logger.error(`重试请求: ${error}`);
                        //     // 重试处理，重新添加到队列
                        //     this.pendingAiRequests.set(requestId, pending);
                        //     this.handleQueue();
                        // }
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

            logger.info(`处理队列中的请求: ${firstRequestId}`);
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
    public async generate(params: GenerateRequest): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.aiWorker) {
                reject(new Error('文档处理Worker未初始化'));
                return;
            }
            const requestId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // 添加到请求队列中
            this.pendingAiRequests.set(requestId, { resolve, reject, params });
            if (!this.isProcessingQueue) {
                this.handleQueue();
            }
        });
    }

    // 检查ollama服务是否可用,尝试5次，2秒超时
    public async checkOllamaServer(): Promise<boolean> {
        for (let i = 0; i < 5; i++) {
            try {
                const response = await fetch('http://127.0.0.1:11434/api/tags');
                if (response.ok) return true;
            } catch { }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('Ollama服务启动超时');
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
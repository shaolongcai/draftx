import { parentPort } from 'worker_threads';
import { Message, Ollama } from 'ollama'
import * as fs from 'fs';
// import { z } from 'zod'

// 注意：Worker 线程中不能使用依赖 Electron 的模块（如 logger）
// 因为 Worker 线程无法访问 Electron 主进程 API


interface ProcessResponse {
    requestId: string;
    success: boolean;
    result?: string; //返回的结果，若传入json格式，则返回后需要格式化
    error?: string;
    type?: string; // 消息类型，如 'done'
}

interface OllamaConfig {
    host: string;
    model: string;
}

// Ollama 配置和实例（延迟初始化）
let ollamaConfig: OllamaConfig = {
    host: 'http://127.0.0.1:11434',
    model: 'qwen2.5vl:3b'
};
let ollama: Ollama | null = null;

// 初始化 Ollama 实例
function initOllama() {
    if (!ollama) {
        ollama = new Ollama({
            host: ollamaConfig.host
        });
    }
    return ollama;
}

// AI处理的核心逻辑
async function aiInWorker(data: GenerateRequest & { requestId: string }): Promise<ProcessResponse> {

    let timeoutId: NodeJS.Timeout;
    // let schema: z.ZodObject<any, any>;

    try {
        // 设置超时处理
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                return {
                    requestId: data.requestId,
                    success: false,
                    error: '文档处理超时',
                    // needRestartOllama: true,
                };
            }, 4 * 60 * 1000); // 4分钟超时
        });
        // JSON结构
        // if (data.isJson) {
        //     schema = data.jsonFormat || {
        //         type: 'object',
        //         properties: {
        //             tags: {
        //                 type: 'array',
        //                 items: {
        //                     type: 'string',
        //                 },
        //             },
        //             summary: {
        //                 type: 'string',
        //             },
        //         },
        //         required: ['tags', 'summary'],
        //     }
        // }
        // const schema =  z.object({
        //         tags: z.array(z.string()),
        //         summary: z.string(),
        //     })
        const messages: Message[] = [
            {
                role: 'user',
                content: `${data.prompt} + ${data.content}`,
                // content: '你好吗？',
            }
        ]
        // 是否为图片
        if (data.isImage) {
            // 读取图片并转换为base64
            const imageBuffer = await fs.promises.readFile(data.path);
            const base64Image = imageBuffer.toString('base64');
            messages[messages.length - 1].images = [base64Image];
        }

        const ollamaInstance = initOllama();
        const chatResponse = await ollamaInstance.chat({
            model: ollamaConfig.model,
            messages: messages,
            stream: true,
            options: {
                num_predict: 1200,
                temperature: 0,
                repeat_penalty: 1.2,
            },
            // format: data.isJson ? schema : undefined,
        });

        // 处理流式响应
        for await (const chunk of chatResponse) {
            clearTimeout(timeoutId); // 每次收到数据重置超时

            const content = chunk.message.content;

            // 发送流式数据块到主线程
            parentPort?.postMessage({
                requestId: data.requestId,
                type: 'stream',
                chunk: content
            });

            // 重新设置超时
            timeoutId = setTimeout(() => { }, 4 * 60 * 1000);
        }

        clearTimeout(timeoutId);

        // 流式完成，发送完成信号
        return {
            requestId: data.requestId,
            success: true,
            type: 'done'
        };

    } catch (error) {
        clearTimeout(timeoutId);
        const msg = error instanceof Error ? error.message : '文档处理失败';
        console.error(msg);
        return {
            requestId: data.requestId,
            success: false,
            error: msg,
            // needRestartOllama: true,
        };
    }
}

// 监听主线程消息
parentPort?.on('message', async (data: any) => {
    // 处理配置初始化消息
    if (data.type === 'init') {
        ollamaConfig = {
            host: data.config.host || 'http://127.0.0.1:11434',
            model: data.config.model || 'qwen2.5vl:3b'
        };
        parentPort?.postMessage({ type: 'init', success: true });
        return;
    }

    // 处理 AI 请求
    const result = await aiInWorker(data as GenerateRequest & { requestId: string });
    parentPort?.postMessage(result);
});
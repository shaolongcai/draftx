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

// 初始化 Ollama 实例（todo：没有配置时应该直接返回）
function initOllama() {
    if (!ollama) {
        console.log('初始化ollama实例')
        ollama = new Ollama({
            host: ollamaConfig.host
        });
    }
    return ollama;
}

// AI处理的核心逻辑
async function aiInWorker(data: GenerateRequest & { requestId: string }): Promise<ProcessResponse> {

    let timeoutId: NodeJS.Timeout | null = null;

    try {
        const ollamaInstance = initOllama();

        const messages: Message[] = [
            { role: 'system', content: data.prompt },
            { role: 'user', content: `${data.content}` }
        ];

        // 是否为图片
        // if (data.isImage) {
        //     const imageBuffer = await fs.promises.readFile(data.path);
        //     const base64Image = imageBuffer.toString('base64');
        //     messages[messages.length - 1].images = [base64Image];
        // }

        // 1. 启动请求的超时控制（包括模型加载时间）
        // 使用 Promise.race 确保 chat 初始化不无限挂起
        const chatStreamPromise = ollamaInstance.chat({
            model: ollamaConfig.model,
            messages: messages,
            stream: true,
            keep_alive: '1h',
            options: {
                num_predict: 4096, // 最大预测 token 数，过少会造成模型卡住
                temperature: 0,
                repeat_penalty: 1.2,
            },
        });

        // 定义启动超时（例如 5 分钟，模型加载可能很慢）
        const startTimeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error('AI 模型加载或响应超时'));
            }, 5 * 60 * 1000);
        });

        // 等待流建立
        const chatResponse = await Promise.race([chatStreamPromise, startTimeoutPromise]);

        // 收到响应，清除启动超时
        if (timeoutId) clearTimeout(timeoutId);

        // 2. 流式传输过程中的超时控制
        // 如果两个 chunk 之间间隔过长，认为卡死
        const streamTimeoutMs = 2 * 60 * 1000; // 2分钟无输出则超时

        const iterator = chatResponse[Symbol.asyncIterator]();

        while (true) {
            // 为每个 chunk 设置超时
            const chunkPromise = iterator.next();
            const chunkTimeoutPromise = new Promise<IteratorResult<any>>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('流式传输中断/超时'));
                }, streamTimeoutMs);
            });

            const result = await Promise.race([chunkPromise, chunkTimeoutPromise]);

            // console.log('收到chunk', result)

            // 收到数据，清除超时
            if (timeoutId) clearTimeout(timeoutId);

            if (result.done) break;

            const content = result.value.message.content;
            if (content.trim() === '') continue; // 思考模式下：message: { role: 'assistant', content: '', thinking: ' sentence' },
            parentPort?.postMessage({
                requestId: data.requestId,
                type: 'stream',
                chunk: content
            });
        }

        return {
            requestId: data.requestId,
            success: true,
            type: 'done'
        };

    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        const msg = error instanceof Error ? error.message : '文档处理失败';
        console.error('Worker AI Error:', msg);

        // 尝试中止 ollama 请求 (如果是 fetch 可以用 abort，这里 ollama-js 封装较深，
        // 只能依靠断开连接或下次请求重置)
        // ollamaInstance.abort() // ollama-js 0.5.0+ might support abort logic if exposed

        return {
            requestId: data.requestId,
            success: false,
            error: msg,
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
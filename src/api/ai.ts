import { ipcMain, BrowserWindow } from "electron";
import { deleteAITool, getAITools, saveAITool, } from "../database/repositories.js";
import { ollamaService } from "../server/ollamaSever.js";
import { logger } from "../core/logger.js";



export function initializeAIApi() {
    // 检查ollama服务
    ipcMain.handle('check-ollama-server', async (event, host: string, modelID: string) => {
        try {
            const checkRes = await ollamaService.checkOllamaServer(host, modelID);
            return {
                code: 0,
                data: checkRes
            }
        } catch (error) {
            logger.error(error)
            return {
                code: 1,
                errMsg: error.message
            }
        }
    })

    // 保存AI工具
    ipcMain.on('save-ai-tool', async (event, toolData: AITool) => {
        try {
            saveAITool(toolData)
        } catch (error) {
            logger.error(error)
        }
    })

    // 获取AI工具
    ipcMain.handle('get-ai-tools', (event, id?: number) => {
        //有id则只获取对应id的
        if (id) {
            return getAITools(id)
        }
        return getAITools()
    })

    // 删除AI工具
    ipcMain.on('delete-ai-tool', (event, id: number) => {
        try {
            deleteAITool(id)
        } catch (error) {
            logger.error(error)
        }
    })

    // AI流式对话
    ipcMain.on('chat-stream', async (event, message: string, context?: string) => {
        logger.info(`准备调用AI，对话参数:${message},上下文：${context}`)
        // 向发送者回复消息,只会发到请求窗口的那个
        const sender = event.sender;

        try {
            // 如果有上下文，需要根据上下文做出回应
            let systemPrompt = '';
            if (context) {
                systemPrompt = 'Answer the question or generate text based on the context and the user input, staying as close to the context as possible.';
            }

            // 调用 ollamaService.generate 并传入流式回调
            await ollamaService.generate(
                {
                    prompt: systemPrompt,
                    content: context ? `Context: ${context}\nUser Input: ${message}` : message,
                    isImage: false,
                },
                // 流式回调函数
                (chunk: { content: string; type: "stream" | "done"; }) => {
                    sender.send('chat-stream-data', chunk);
                }
            );

            // 流式完成后发送结束信号
            sender.send('chat-stream-end');
        } catch (error: any) {
            logger.error(`流式对话错误: ${error.message || error}`);
            sender.send('chat-stream-error', error.message || '未知错误');
        }

    })
}

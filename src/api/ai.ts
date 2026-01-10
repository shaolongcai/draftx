import { ipcMain, BrowserWindow } from "electron";
import { getAITools, saveAITool, } from "../database/repositories.js";
import { ollamaService } from "../server/ollamaSever.js";
import { logger } from "../core/logger.js";



export function initializeAIApi() {

    // 检查ollama服务
    ipcMain.handle('check-ollama-server', async (event) => {
        try {
            const checkRes = await ollamaService.checkOllamaServer();
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

    // AI流式对话
    ipcMain.on('chat-stream', async (event, message?: string, toolId?: number) => {

        logger.info(`对话参数:${message},工具ID：${toolId}`)

        // 向发送者回复消息,只会发到请求窗口的那个
        const sender = event.sender;

        try {
            //如果有 toolId，获取对应的工具配置
            let systemPrompt = '';
            if (toolId) {
                const tool = getAITools(toolId) as AITool;
                if (tool && tool.prompt) {
                    systemPrompt = tool.prompt;
                }
            }

            logger.info('准备调用AI')

            // 调用 ollamaService.generate 并传入流式回调
            await ollamaService.generate(
                {
                    prompt: systemPrompt,
                    content: message,
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

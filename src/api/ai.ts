import { ipcMain, BrowserWindow } from "electron";
import { addDeleteDay, getAITools, getGuideMemo, getRecentStickys, saveAITool, saveStickyNote, searchStickyNote } from "../database/repositories.js";
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
    ipcMain.on('chat-stream', async (event, message: string = '很高兴认识你', toolId?: number) => {
        const sender = event.sender;

        try {
            // 如果有 toolId，获取对应的工具配置
            let systemPrompt = '';
            if (toolId) {
                const tool = getAITools(toolId) as AITool;
                if (tool && tool.prompt) {
                    systemPrompt = tool.prompt;
                }
            }

            // 调用 Ollama API 进行流式请求
            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen2.5vl:3b', // 使用的模型
                    prompt: systemPrompt ? `${systemPrompt}\n\n${message}` : message,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API 请求失败: ${response.statusText}`);
            }

            // 读取流式响应
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('无法获取响应流');
            }

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    sender.send('chat-stream-end');
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            sender.send('chat-stream-data', json.response);
                        }
                        if (json.done) {
                            sender.send('chat-stream-end');
                        }
                    } catch (e) {
                        // 忽略 JSON 解析错误
                    }
                }
            }
        } catch (error: any) {
            logger.error(`流式对话错误: ${error.message || error}`);
            sender.send('chat-stream-error', error.message || '未知错误');
        }
    })
}

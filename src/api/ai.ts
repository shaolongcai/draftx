import { ipcMain } from "electron";
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
}

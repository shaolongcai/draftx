import { ipcMain } from "electron";
import { addDeleteDay, getGuideMemo, getRecentStickys, saveStickyNote, searchStickyNote } from "../database/repositories.js";
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
}

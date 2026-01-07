import { ipcMain } from "electron";
import { addDeleteDay, getGuideMemo, saveStickyNote, getDraft } from "../database/repositories.js";



export function initializeDraftApi() {

    // 保存 stickyNote 到数据库
    ipcMain.on('save-sticky', (event, stickyNote: StickyParmas) => {
        console.log('保存便利贴', stickyNote);
        saveStickyNote(stickyNote);
    });

    // 搜索 stickyNote 从数据库
    ipcMain.handle('get-draft', (event, query: string, limit: number) => {
        return getDraft(query, limit);
    });

    // 点击增加天数
    ipcMain.on('add-delete-day', (event, id: number) => {
        addDeleteDay(id);
    });

    // 获取引导memo
    ipcMain.handle('get-guide-memo', async (event) => {
        return getGuideMemo();
    })
}

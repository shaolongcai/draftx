import { ipcMain } from "electron";
import { getGuideMemo, saveStickyNote, getDraft, refreshDeleteDay } from "../database/repositories.js";



export function initializeDraftApi() {

    // 保存 stickyNote 到数据库
    ipcMain.on('save-sticky', (event, stickyNote: StickyParmas) => {
        saveStickyNote(stickyNote);
    });

    // 搜索 stickyNote 从数据库
    ipcMain.handle('get-draft', (event, query: string, limit: number) => {
        return getDraft(query, limit);
    });

    // 点击刷新删除时间
    ipcMain.on('refresh-delete-day', (event, id: number) => {
        refreshDeleteDay(id);
    });

    // 获取引导memo
    ipcMain.handle('get-guide-memo', async (event) => {
        return getGuideMemo();
    })
}

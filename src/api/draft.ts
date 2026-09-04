import { ipcMain } from "electron";
import { getGuideMemo, saveStickyNote, getDraft, refreshDeleteDay, getDraftByUuid, type DraftTimeFilter } from "../database/repositories.js";



export function initializeDraftApi() {

    // 保存 stickyNote 到数据库
    ipcMain.on('save-sticky', (event, stickyNote: StickyParmas) => {
        saveStickyNote(stickyNote);
    });

    // 搜索 stickyNote 从数据库
    ipcMain.handle('get-draft', (event, query: string, limit: number, timeFilter?: DraftTimeFilter) => {
        return getDraft(query, limit, timeFilter);
    });

    // 点击刷新删除时间
    ipcMain.on('refresh-delete-day', (event, id: number) => {
        refreshDeleteDay(id);
    });

    /**
     * 根据ID获取草稿
     * @deprecated 使用 getDraftByUuid 替代
     */
    ipcMain.handle('get-guide-memo', async (event) => {
        return getGuideMemo();
    })

    // 根据ID获取草稿
    ipcMain.handle('get-draft-by-uuid', async (event, uuid: string) => {
        return getDraftByUuid(uuid);
    })
}

import { ipcMain } from "electron";
import { addDeleteDay, saveStickyNote, searchStickyNote } from "../database/repositories.js";



export function initializeStickyApi() {

    // 保存 stickyNote 到数据库
    ipcMain.on('save-sticky', (event, stickyNote: StickyParmas) => {
        saveStickyNote(stickyNote);
    });

    // 搜索 stickyNote 从数据库
    ipcMain.handle('search-sticky', (event, query: string) => {
        const stickys = searchStickyNote(query);
        return stickys;
    });

    // 点击增加天数
    ipcMain.on('add-delete-day', (event, id: number) => {
        addDeleteDay(id);
    });
}

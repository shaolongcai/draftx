import { ipcMain } from "electron";
import { saveStickyNote } from "../database/repositories.js";



export function initializeStickyApi() {

    /**
     * 保存 stickyNote 到数据库
     * @param stickyNote 
     */
    ipcMain.on('save-sticky', (event, stickyNote: StickyParmas) => {
        saveStickyNote(stickyNote);
    });

}

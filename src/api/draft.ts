import { ipcMain } from "electron";
import { getNoteByUuid, getNotes, saveNote, type NoteTimeFilter } from "../database/repositories.js";
import { saveAsset } from "../core/noteFileService.js";
import pathConfig from "../core/pathConfigs.js";



export function initializeDraftApi() {

    // 保存笔记（md 文件为事实来源；空内容 = 删除）
    ipcMain.on('save-sticky', (event, note: NoteParmas) => {
        saveNote(note);
    });

    // 搜索/获取笔记列表（仅元数据，不含正文）
    ipcMain.handle('get-draft', (event, query: string, limit: number, timeFilter?: NoteTimeFilter) => {
        return getNotes(query, limit, timeFilter);
    });

    // 根据 UUID 获取笔记（元数据 + md 正文）
    ipcMain.handle('get-draft-by-uuid', async (event, uuid: string) => {
        return getNoteByUuid(uuid);
    })

    // 保存图片资源到 notes/.asset/，返回相对路径（如 ".asset/xxx.png"）
    ipcMain.handle('save-image-asset', async (event, data: ArrayBuffer | Uint8Array, ext?: string) => {
        const buffer = Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
        return saveAsset(buffer, ext);
    })

    // 获取笔记根目录绝对路径（前端拼接图片 file:// URL 用）
    ipcMain.handle('get-notes-dir', async () => {
        return pathConfig.get('notes');
    })
}

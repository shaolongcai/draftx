import { ipcMain } from "electron";
import { deleteNoteByUuid, getNoteByUuid, getNotes, saveNote, type NoteTimeFilter } from "../database/repositories.js";
import { saveAsset } from "../core/noteFileService.js";
import pathConfig from "../core/pathConfigs.js";
import { getGuideContent } from "../data/data.js";
import { reportErrorToWechat } from "../units/report.js";
import { logger } from "../core/logger.js";
import pkg from 'node-machine-id';
const { machineId } = pkg;



export function initializeDraftApi() {

    // 保存笔记（md 文件为事实来源；从未保存过的新笔记内容为空则不落盘）
    ipcMain.on('save-sticky', (event, note: NoteParmas) => {
        saveNote(note);
    });

    // 删除笔记（md 文件 + 元数据 + 索引），返回是否删除成功
    ipcMain.handle('delete-note', (event, uuid: string) => {
        return deleteNoteByUuid(uuid);
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

    // 初始化引导笔记：用户在引导页选择完语言后调用，按语言生成中/英文版本
    // 幂等：已存在 uuid='guide' 的笔记则不重复创建，返回是否新建
    ipcMain.handle('initialize-guide-note', async (_event, language?: string) => {
        if (getNoteByUuid('guide')) {
            return false;
        }
        // 首次创建引导笔记 = 新增一个用户，上报到企业微信（失败不影响笔记创建）
        try {
            const id = await machineId(true);
            reportErrorToWechat({
                类型: '新增一个用户',
                机器码: id,
            });
        } catch (error) {
            logger.error(`新用户上报失败: ${error}`);
        }
        const { title, content } = getGuideContent(language);
        saveNote({
            uuid: 'guide',
            title,
            content,
        });
        logger.info(`引导笔记已创建（语言: ${language || 'en-US'}）`);
        return true;
    })
}

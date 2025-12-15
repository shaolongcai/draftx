import { getDatabase } from './sqlite.js'
import { logger } from '../core/logger.js';
import dayjs from 'dayjs';

const db = getDatabase()



/**
 * 保存 stickyNote 到数据库
 * @param stickyNote 
 */
export const saveStickyNote = (stickyNote: StickyParmas) => {
    try {
        const now = new Date().toISOString();
        const deletedAt = dayjs().add(30, 'day').toISOString();
        // 存在即更新，不存在则插入
        const upsertStmt = db.prepare(`
                INSERT INTO stickys ( uuid, content, content_string, title, created_at, modified_at,deleted_at)
                VALUES (?, ?, ?, ?, ?, ?,?)
                ON CONFLICT( uuid ) DO UPDATE SET
                    content = excluded.content,
                    content_string = excluded.content_string,
                    title = excluded.title,
                    modified_at = excluded.modified_at
            `);
        upsertStmt.run(stickyNote.uuid, stickyNote.content, stickyNote.contentString, stickyNote.title, now, now, deletedAt);
    } catch (error) {
        logger.error(error)
    }
};
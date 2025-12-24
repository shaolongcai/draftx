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
        // const deletedAt = dayjs().add(30, 'day').toISOString();
        const deletedAt = dayjs().add(7, 'day').toISOString(); //测试用，只增加一天
        // 存在即更新，不存在则插入
        const upsertStmt = db.prepare(`
                INSERT INTO stickys ( uuid, content, title, created_at, modified_at,deleted_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT( uuid ) DO UPDATE SET
                    content = excluded.content,
                    title = excluded.title,
                    modified_at = excluded.modified_at
            `);
        upsertStmt.run(stickyNote.uuid, stickyNote.content, stickyNote.title, now, now, deletedAt);
    } catch (error) {
        logger.error(error)
    }
};


/**
 * 搜索 stickyNote 从数据库
 * @param query 
 * @returns 
 */
export const searchStickyNote = (query: string, limit: number = 50) => {
    try {
        // 拆分为单字的方法（用于 FTS5 前缀查询，FTS5会把每个字作为一个 token，作为倒排）
        const buildFtsQuery = (input: string) => {
            const tokens = input
                .toLowerCase()
                .trim()
                .split(/\s+/)
                .filter(t => t.length > 0 && t.length <= 32)
                .slice(0, 8); // 控制词数，避免过长导致性能问题
            if (tokens.length === 0) return input.toLowerCase();
            // 用 OR + 前缀匹配扩大召回（fts5 支持 token* 前缀查询）
            return tokens.map(t => `${t}*`).join(' OR ');
        };
        const ftsQuery = buildFtsQuery(query);

        const stmt = db.prepare(`
            WITH q(query) AS (SELECT lower(?)),
            ftsHits AS (
                SELECT 
                    rowid,
                    snippet(stickys_fts, 0, '<mark>', '</mark>', '...', 32) AS snippet,
                    bm25(stickys_fts) AS fts_score
                FROM stickys_fts
                WHERE stickys_fts MATCH ?
                ORDER BY bm25(stickys_fts)
                LIMIT ?
            )
            SELECT 
                s.id, s.uuid, s.title, s.content, s.created_at, s.modified_at,s.deleted_at,
                (
                    0.35 * CASE WHEN lower(s.title) LIKE q.query || '%' THEN CAST(length(q.query) AS REAL) / NULLIF(length(s.title), 0) ELSE 0 END
                    + 0.25 * CASE WHEN instr(lower(s.title), q.query) > 0 THEN 1 - (instr(lower(s.title), q.query) - 1) / CAST(length(s.title) AS REAL) ELSE 0 END
                    + 0.18 * COALESCE(1.0 / (ftsHits.fts_score + 1.0), 0.0)
                    + 0.10 * (1.0 - 1.0 / (COALESCE(s.click_count, 0) + 1))
                    + 0.06 * (
                        CASE 
                            WHEN s.last_access_time IS NULL THEN 0
                            ELSE 
                                CASE 
                                    WHEN (julianday('now') - julianday(s.last_access_time)) <= 0.5 THEN 1.0
                                    WHEN (julianday('now') - julianday(s.last_access_time)) >= 90.0 THEN 0.0
                                    ELSE 1.0 - ((julianday('now') - julianday(s.last_access_time)) - 0.5) / (90.0 - 0.5)
                                END
                        END
                    )
                    + 0.04 * (1.0 - MIN(length(s.title), 255) / 255.0)
                ) AS score,
                ftsHits.snippet AS snippet
            FROM stickys s
            LEFT JOIN ftsHits ON ftsHits.rowid = s.id
            CROSS JOIN q
            WHERE (
                lower(s.title) LIKE '%' || q.query || '%'
                OR lower(s.content) LIKE '%' || q.query || '%'
                OR ftsHits.rowid IS NOT NULL
            )
            ORDER BY score DESC, s.title
            LIMIT ?
        `);
        const rows = stmt.all(query, ftsQuery, limit, limit);
        return rows;
    } catch (error) {
        logger.error(error)
        return []
    }
}


/**
 * 增加天数
 */
export const addDeleteDay = (id: number) => {
    try {
        // 取出deleted_at
        const stmt = db.prepare(`
            SELECT deleted_at FROM stickys WHERE id = ?
        `);
        const row = stmt.get(id);
        if (!row) {
            logger.error('sticky note not found');
            return;
        }
        const deletedAt = row.deleted_at;
        // 增加3天，并更新数据库
        const newDeletedAt = dayjs(deletedAt).add(3, 'day').toISOString(); // 转换为 ISO 字符串
        const updateStmt = db.prepare(`
            UPDATE stickys SET deleted_at = ? WHERE id = ?
        `);
        updateStmt.run(newDeletedAt, id);
    } catch (error) {
        logger.error(error)
    }
}


/**
 * 删除过期的便利贴
 */
export const deleteExpiredStickys = () => {
    try {
        // 取出所有过期的便利贴
        const stmt = db.prepare(`
            SELECT id FROM stickys WHERE deleted_at IS NOT NULL AND deleted_at <= datetime('now')
        `);
        const rows = stmt.all();
        if (rows.length === 0) {
            logger.info('no expired sticky notes found');
            return;
        }

        // 删除过期的便利贴
        const deleteStmt = db.prepare(`
            DELETE FROM stickys WHERE id = ?
        `);
        rows.forEach(row => {
            logger.info(`删除了过期的便利贴 ${row.id}`);
            deleteStmt.run(row.id);
        });
    } catch (error) {
        logger.error(error)
    }
}


/**
 * 获取最近的便利贴
 */
export const getRecentStickys = (limit: number = 12) => {
    try {
        const stmt = db.prepare(`
            SELECT id, uuid, title, content, created_at, modified_at, deleted_at
            FROM stickys
            ORDER BY modified_at DESC
            LIMIT ?
        `);
        return stmt.all(limit);
    } catch (error) {
        logger.error(error);
        return [];
    }
};


/**
 * 获取UUID为guid 的便利贴
 */
export const getGuideMemo = () => {
    try {
        const stmt = db.prepare(`
            SELECT id, uuid, title, content, created_at, modified_at, deleted_at
            FROM stickys
            WHERE uuid = ?
            LIMIT 1
        `);
        return stmt.get('guide');
    } catch (error) {
        logger.error(error);
        return null;
    }
}
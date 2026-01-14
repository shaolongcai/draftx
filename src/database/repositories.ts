import { getConfig, getDatabase } from './sqlite.js'
import { logger } from '../core/logger.js';
import dayjs from 'dayjs';

const db = getDatabase()


/**
 * 保存 stickyNote 到数据库
 * @param stickyNote 
 */
export const saveStickyNote = (stickyNote: StickyParmas) => {
    try {
        // 若content为空，则删除该草稿
        if (!stickyNote.content.trim()) {
            const deleteStmt = db.prepare(`
                DELETE FROM stickys
                WHERE uuid = ?
            `);
            deleteStmt.run(stickyNote.uuid);
            return;
        }

        const now = new Date().toISOString();
        // const deletedAt = dayjs().add(30, 'day').toISOString();
        const deletedAt = dayjs().add(30, 'day').toISOString(); //测试用，只增加一天
        // 存在即更新，不存在则插入
        const upsertStmt = db.prepare(`
                INSERT INTO stickys ( uuid, content, content_json, title, created_at, modified_at, deleted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT( uuid ) DO UPDATE SET
                    content = excluded.content,
                    content_json = excluded.content_json,
                    title = excluded.title,
                    modified_at = excluded.modified_at
            `);
        upsertStmt.run(stickyNote.uuid, stickyNote.content, stickyNote.contentJson, stickyNote.title, now, now, deletedAt);
    } catch (error) {
        logger.error(error)
    }
};


/**
 * 从数据库获取操作
 * @param query 搜索关键词 如果没有则返回所有
 * @param limit 限制返回数量
 * @returns 直接返回草稿列表
 */
export const getDraft = (query?: string, limit: number = 50) => {
    try {
        // 空查询：直接返回全部，按修改时间排序
        if (!query || query.trim() === '') {
            const stmt = db.prepare(`
                SELECT id, uuid, title, content, content_json, created_at, modified_at, deleted_at
                FROM stickys
                ORDER BY modified_at DESC
                LIMIT ?
            `);
            const rows = stmt.all(limit);
            return rows;
        }

        const stmt = db.prepare(`
            WITH q(query) AS (SELECT lower(?))
            SELECT 
                s.id, s.uuid, s.title, s.content, s.content_json, s.created_at, s.modified_at, s.deleted_at,
                (
                    0.40 * CASE WHEN lower(s.title) LIKE q.query || '%' THEN CAST(length(q.query) AS REAL) / NULLIF(length(s.title), 0) ELSE 0 END
                    + 0.30 * CASE WHEN instr(lower(s.title), q.query) > 0 THEN 1 - (instr(lower(s.title), q.query) - 1) / CAST(length(s.title) AS REAL) ELSE 0 END
                    + 0.15 * CASE WHEN instr(lower(s.content), q.query) > 0 THEN 1.0 ELSE 0 END
                    + 0.10 * (1.0 - 1.0 / (COALESCE(s.click_count, 0) + 1))
                    + 0.05 * (1.0 - MIN(length(s.title), 255) / 255.0)
                ) AS score
            FROM stickys s
            CROSS JOIN q
            WHERE (
                lower(s.title) LIKE '%' || q.query || '%'
                OR lower(s.content) LIKE '%' || q.query || '%'
            )
            ORDER BY score DESC, s.title
            LIMIT ?
        `);
        const rows = stmt.all(query, limit);
        return rows;
    } catch (error) {
        logger.error(error)
        return []
    }
}


/**
 * 增加天数：刷新删除天数
 */
export const refreshDeleteDay = (id: number) => {
    try {
        logger.info(`刷新删除的时间，草稿ID：${id}`);
        // 增加3天，并更新数据库
        const newDeletedAt = dayjs().add(30, 'day').toISOString(); // 转换为 ISO 字符串
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
 * 获取UUID为guid 的便利贴
 */
export const getGuideMemo = () => {
    try {
        const stmt = db.prepare(`
            SELECT id, uuid, title, content, content_json, created_at, modified_at, deleted_at
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

/**
 * 通过id获取便利贴
 */
export const getStickyById = (id: number) => {
    try {
        const stmt = db.prepare(`
            SELECT id, uuid, title, content, content_json, created_at, modified_at, deleted_at
            FROM stickys
            WHERE id = ?
            LIMIT 1
        `);
        return stmt.get(id);
    } catch (error) {
        logger.error(error);
        return null;
    }
}



/**
 * 添加AI工具
 */
export const saveAITool = (tool: AITool): void => {
    try {
        if (tool.id) {
            // 若有ID则为更新
            const stmt = db.prepare(`
                UPDATE ai_tools 
                SET name = ?, prompt = ?, emoji = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            stmt.run(tool.name, tool.prompt, tool.emoji || null, tool.id);
        } else {
            // 若没有ID则为新增
            const stmt = db.prepare(`
                INSERT INTO ai_tools (name, prompt, emoji, created_at, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
            stmt.run(tool.name, tool.prompt, tool.emoji || null);
        }
    } catch (error) {
        logger.error(error);
    }
}


/**
 * 获取AI工具
 */
export const getAITools = (id?: number): AITool | AITool[] | null => {
    try {
        if (id) {
            // 根据ID获取单个AI工具
            const stmt = db.prepare(`
                SELECT id, name, prompt, emoji, created_at, updated_at
                FROM ai_tools
                WHERE id = ?
            `);
            return stmt.get(id) as AITool;
        } else {
            // 获取所有AI工具
            const stmt = db.prepare(`
                SELECT id, name, prompt, emoji, created_at, updated_at
                FROM ai_tools
                ORDER BY created_at DESC
            `);
            return stmt.all() as AITool[];
        }
    } catch (error) {
        logger.error(error);
        return null;
    }
}


/**
 * 删除AI工具
 */
export const deleteAITool = (id: number): void => {
    try {
        const stmt = db.prepare(`
            DELETE FROM ai_tools WHERE id = ?
        `);
        stmt.run(id);
    } catch (error) {
        logger.error(error);
    }
}


/**
 * 获取 Ollama 配置
 */
export const getOllamaConfig = (): { host: string; model: string } => {
    try {
        const aiProvider = getConfig('ai_provider') as string
        const host = JSON.parse(aiProvider).host
        const model = JSON.parse(aiProvider).model

        return {
            host: host,
            model: model
        };
    } catch (error) {
        logger.error(error);
        return {
            host: 'http://127.0.0.1:11434',
            model: 'qwen2.5vl:3b'
        };
    }
}
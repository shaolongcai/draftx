import { getConfig, getDatabase } from './sqlite.js'
import { logger } from '../core/logger.js';
import crypto from 'crypto';
import {
    deleteNote,
    extractTitleFromMarkdown,
    hashContent,
    listMarkdownFiles,
    pathForNewNote,
    readNote,
    renameNote,
    writeNote,
} from '../core/noteFileService.js';

const db = getDatabase()


// ==================== 笔记（md 文件 + 元数据） ====================

export type NoteTimeFilter = {
    createdAfter?: string;
    createdBefore?: string;
    modifiedAfter?: string;
    modifiedBefore?: string;
}

type NoteRow = {
    id: number;
    uuid: string;
    path: string;
    title: string | null;
    mtime: number;
    hash: string;
    created_at: string;
}

/** 同步/更新单条笔记的 FTS 索引 */
const upsertFts = (id: number, title: string, content: string) => {
    db.prepare(`DELETE FROM fts_index WHERE rowid = ?`).run(id);
    db.prepare(`INSERT INTO fts_index (rowid, title, content) VALUES (?, ?, ?)`).run(id, title, content);
}

/** 删除单条笔记的 FTS 索引 */
const deleteFts = (id: number) => {
    db.prepare(`DELETE FROM fts_index WHERE rowid = ?`).run(id);
}

const getNoteMetaByUuid = (uuid: string): NoteRow | undefined => {
    const stmt = db.prepare(`SELECT id, uuid, path, title, mtime, hash, created_at FROM notes WHERE uuid = ? LIMIT 1`);
    return stmt.get(uuid) as NoteRow | undefined;
}

const getNoteMetaByPath = (relPath: string): NoteRow | undefined => {
    const stmt = db.prepare(`SELECT id, uuid, path, title, mtime, hash, created_at FROM notes WHERE path = ? LIMIT 1`);
    return stmt.get(relPath) as NoteRow | undefined;
}

/**
 * 保存笔记：写入 md 文件（事实来源），再同步元数据与 FTS 索引
 * - content 为空 = 删除该笔记（文件 + 元数据 + 索引）
 * @returns 保存结果；删除时返回 { deleted: true }
 */
export const saveNote = (note: NoteParmas): { uuid: string; path: string; mtime: number } | { deleted: true } | null => {
    try {
        const uuid = note.uuid || crypto.randomUUID();
        const existing = getNoteMetaByUuid(uuid);

        // 空内容 = 删除笔记
        if (!note.content.trim()) {
            if (existing) {
                deleteNote(existing.path);
                deleteFts(existing.id);
                db.prepare(`DELETE FROM notes WHERE id = ?`).run(existing.id);
                logger.info(`笔记内容为空，已删除: ${existing.path}`);
            }
            return { deleted: true };
        }

        // 确定文件路径：已有笔记优先按标题同步文件名，否则按标题生成不冲突的新文件名
        let relPath = existing?.path
            ?? note.path
            ?? pathForNewNote(note.title || extractTitleFromMarkdown(note.content));

        // 标题变化经前端 200ms 防抖后到达这里；重命名失败时回退原路径，不影响正文保存
        if (existing && note.title?.trim()) {
            const renamedPath = renameNote(existing.path, note.title);
            if (renamedPath) {
                relPath = renamedPath;
            }
        }

        // 1. 写 md 文件（事实来源）
        const mtime = writeNote(relPath, note.content);
        const hash = hashContent(note.content);
        const title = note.title || extractTitleFromMarkdown(note.content) || relPath.replace(/\.md$/i, '');

        // 2. 同步元数据
        const upsertStmt = db.prepare(`
            INSERT INTO notes (uuid, path, title, mtime, hash)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(uuid) DO UPDATE SET
                path = excluded.path,
                title = excluded.title,
                mtime = excluded.mtime,
                hash = excluded.hash
        `);
        upsertStmt.run(uuid, relPath, title, mtime, hash);

        // 3. 同步 FTS 索引
        const row = getNoteMetaByUuid(uuid);
        if (row) {
            upsertFts(row.id, title, note.content);
        }

        return { uuid, path: relPath, mtime };
    } catch (error) {
        logger.error(error);
        return null;
    }
};


/** 构造时间过滤条件（created_at 为 datetime，mtime 为毫秒时间戳） */
const buildTimeFilter = (timeFilter: NoteTimeFilter, conditions: string[], params: any[]) => {
    if (timeFilter.createdAfter) {
        conditions.push(`datetime(n.created_at) >= datetime(?)`);
        params.push(timeFilter.createdAfter);
    }
    if (timeFilter.createdBefore) {
        conditions.push(`datetime(n.created_at) <= datetime(?)`);
        params.push(timeFilter.createdBefore);
    }
    if (timeFilter.modifiedAfter) {
        conditions.push(`n.mtime >= ?`);
        params.push(Date.parse(timeFilter.modifiedAfter));
    }
    if (timeFilter.modifiedBefore) {
        conditions.push(`n.mtime <= ?`);
        params.push(Date.parse(timeFilter.modifiedBefore));
    }
}

/** 转义 FTS5 查询字符串（作为短语处理） */
const escapeFtsQuery = (query: string) => `"${query.replace(/"/g, '""')}"`;

/** 生成笔记纯文本预览（去除常见 Markdown 语法、折叠空白），供列表页展示；首行若为标题对应的 h1 则跳过，避免预览与标题重复 */
const buildPreview = (content: string, maxLen = 120, title?: string): string => {
    let source = content;
    if (title) {
        const lines = content.split('\n');
        const firstIdx = lines.findIndex(l => l.trim() !== '');
        if (firstIdx !== -1) {
            const firstText = lines[firstIdx].replace(/^\s{0,3}#{1,6}\s+/, '').trim();
            if (firstText === title.trim()) {
                lines.splice(firstIdx, 1);
                source = lines.join('\n');
            }
        }
    }
    const text = source
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')      // 图片 -> alt 文本
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')       // 链接 -> 链接文本
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')            // 标题标记
        .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')     // 任务列表标记
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')       // 列表标记
        .replace(/[*_`~]+/g, '')                       // 强调/代码标记
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
};

/**
 * 短查询（< 3 字符）回退：trigram 索引不支持，直接扫描文件匹配
 */
const searchNotesByScan = (query: string, limit: number, timeFilter: NoteTimeFilter) => {
    const conditions: string[] = [];
    const params: any[] = [];
    buildTimeFilter(timeFilter, conditions, params);
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const stmt = db.prepare(`
        SELECT n.id, n.uuid, n.path, n.title, n.mtime, n.hash, n.created_at
        FROM notes n ${whereClause}
        ORDER BY n.mtime DESC
    `);
    const rows = stmt.all(...params) as NoteRow[];

    const lowerQuery = query.toLowerCase();
    const results: any[] = [];
    for (const row of rows) {
        const title = row.title || '';
        let score = 0;
        let snippet: string | undefined;

        if (title.toLowerCase().includes(lowerQuery)) {
            score = 1; // 标题命中优先
        } else {
            const content = readNote(row.path);
            if (content && content.toLowerCase().includes(lowerQuery)) {
                score = 0.5;
                const idx = content.toLowerCase().indexOf(lowerQuery);
                const start = Math.max(0, idx - 30);
                const raw = content.slice(start, idx + query.length + 30).replace(/\s+/g, ' ');
                snippet = raw.replace(
                    new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'),
                    (m) => `<mark>${m}</mark>`
                );
            }
        }

        if (score > 0) {
            results.push({ ...row, score, snippet });
            if (results.length >= limit) break;
        }
    }
    return results;
}

/**
 * 获取笔记列表 / 全文搜索
 * @param query 搜索关键词，为空返回全部（仅元数据，不含正文）
 * @param limit 限制返回数量
 * @param timeFilter 时间过滤（ISO 字符串）
 */
export const getNotes = (query?: string, limit: number = 50, timeFilter: NoteTimeFilter = {}) => {
    try {
        const normalizedQuery = query?.trim();

        // 空查询：返回全部元数据（附纯文本预览），按修改时间排序
        if (!normalizedQuery) {
            const conditions: string[] = [];
            const params: any[] = [];
            buildTimeFilter(timeFilter, conditions, params);
            const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
            const stmt = db.prepare(`
                SELECT n.id, n.uuid, n.path, n.title, n.mtime, n.created_at
                FROM notes n
                ${whereClause}
                ORDER BY n.mtime DESC
                LIMIT ?
            `);
            const rows = stmt.all(...params, limit) as NoteRow[];
            // 列表页需要内容预览：读取文件生成纯文本摘要（无搜索高亮，跳过与标题重复的首行）
            return rows.map(row => ({ ...row, snippet: buildPreview(readNote(row.path) ?? '', 120, row.title ?? undefined) }));
        }

        // trigram 索引要求查询长度 >= 3 个字符，短查询回退到文件扫描
        if ([...normalizedQuery].length < 3) {
            return searchNotesByScan(normalizedQuery, limit, timeFilter);
        }

        const conditions: string[] = [];
        const params: any[] = [escapeFtsQuery(normalizedQuery)];
        buildTimeFilter(timeFilter, conditions, params);
        const whereClause = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

        const stmt = db.prepare(`
            SELECT
                n.id, n.uuid, n.path, n.title, n.mtime, n.created_at,
                bm25(fts_index, 10.0, 1.0) AS score,
                snippet(fts_index, 1, '<mark>', '</mark>', '…', 32) AS snippet
            FROM fts_index f
            JOIN notes n ON n.id = f.rowid
            WHERE fts_index MATCH ?
            ${whereClause}
            ORDER BY score
            LIMIT ?
        `);
        return stmt.all(...params, limit);
    } catch (error) {
        logger.error(error);
        return [];
    }
}


/**
 * 通过 UUID 获取笔记（元数据 + md 正文）
 */
export const getNoteByUuid = (uuid: string) => {
    try {
        const row = getNoteMetaByUuid(uuid);
        if (!row) return null;
        const content = readNote(row.path);
        return { ...row, content };
    } catch (error) {
        logger.error(error);
        return null;
    }
}

/**
 * 通过路径获取笔记（元数据 + md 正文）
 */
export const getNoteByPath = (relPath: string) => {
    try {
        const row = getNoteMetaByPath(relPath);
        if (!row) return null;
        const content = readNote(row.path);
        return { ...row, content };
    } catch (error) {
        logger.error(error);
        return null;
    }
}


/**
 * 启动对账：扫描 notes 目录，使元数据/索引与 md 文件（事实来源）保持一致
 * - 磁盘新文件 → 补充元数据并建立索引
 * - 文件被外部修改（mtime/hash 变化）→ 更新元数据并重建索引
 * - 文件消失 → 删除元数据与索引
 */
export const syncNotesWithFiles = () => {
    try {
        const files = listMarkdownFiles();
        const fileMap = new Map(files.map(f => [f.path, f.mtime]));
        const rows = db.prepare(`SELECT id, uuid, path, title, mtime, hash, created_at FROM notes`).all() as NoteRow[];
        const rowMap = new Map(rows.map(r => [r.path, r]));

        let added = 0, updated = 0, removed = 0;

        // 新增 / 更新
        for (const file of files) {
            const row = rowMap.get(file.path);
            const content = readNote(file.path);
            if (content === null) continue;
            const hash = hashContent(content);

            if (!row) {
                const uuid = crypto.randomUUID();
                const title = extractTitleFromMarkdown(content) || file.path.replace(/\.md$/i, '');
                db.prepare(`
                    INSERT INTO notes (uuid, path, title, mtime, hash)
                    VALUES (?, ?, ?, ?, ?)
                `).run(uuid, file.path, title, file.mtime, hash);
                const inserted = getNoteMetaByPath(file.path);
                if (inserted) upsertFts(inserted.id, title, content);
                added++;
            } else if (row.hash !== hash) {
                const title = extractTitleFromMarkdown(content) || row.title;
                db.prepare(`UPDATE notes SET title = ?, mtime = ?, hash = ? WHERE id = ?`)
                    .run(title, file.mtime, hash, row.id);
                upsertFts(row.id, title || '', content);
                updated++;
            } else if (row.mtime !== file.mtime) {
                // 内容未变，仅同步 mtime
                db.prepare(`UPDATE notes SET mtime = ? WHERE id = ?`).run(file.mtime, row.id);
            }
        }

        // 删除磁盘上已不存在的笔记
        for (const row of rows) {
            if (!fileMap.has(row.path)) {
                deleteFts(row.id);
                db.prepare(`DELETE FROM notes WHERE id = ?`).run(row.id);
                removed++;
            }
        }

        logger.info(`笔记对账完成: 新增 ${added}, 更新 ${updated}, 移除 ${removed}`);
        return { added, updated, removed };
    } catch (error) {
        logger.error(error);
        return { added: 0, updated: 0, removed: 0 };
    }
}


// ==================== AI 工具 ====================

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

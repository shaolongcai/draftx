/**
 * 负责数据库的表定义以及创建、添加字段
 *
 * 存储设计（见 Agent.md）：
 * - 笔记内容以 .md 文件为事实来源（~/.draftx/notes/）
 * - SQLite 仅存储元数据（path/title/mtime/hash）+ FTS5 全文索引（fts_index）
 */
import { Database } from 'better-sqlite3'


/**
 * 删除旧版 stickys 相关表（不再兼容旧数据）
 * @param db
 */
export const dropLegacyStickysDb = (db: Database) => {
  db.exec(`
    DROP TRIGGER IF EXISTS stickys_fts_ai;
    DROP TRIGGER IF EXISTS stickys_fts_au;
    DROP TRIGGER IF EXISTS stickys_fts_delete;
    DROP TABLE IF EXISTS stickys_fts;
    DROP TABLE IF EXISTS stickys;
  `)
}


/**
 * 笔记元数据表：仅存储 md 文件的元数据，内容以 .md 文件为事实来源
 * - path: 相对 notes 目录的路径，如 "guide.md"、"2026/我的笔记.md"
 * - title: 笔记标题（取第一个 h1 或文件名）
 * - mtime: 文件修改时间（毫秒时间戳）
 * - hash:  内容 sha1，用于检测外部修改
 * @param db
 */
export const createNotesDb = (db: Database) => {
  db.exec(`
            CREATE TABLE IF NOT EXISTS notes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              uuid TEXT UNIQUE,
              path TEXT NOT NULL UNIQUE,
              title TEXT,
              mtime INTEGER NOT NULL,
              hash TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_uuid ON notes (uuid);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_path ON notes (path);
          `)
}


/**
 * 全文搜索索引（FTS5 虚拟表）
 * - rowid 与 notes.id 对应（由 repositories 在写入时手动同步，不使用触发器）
 * - 使用 trigram tokenizer：按三字符切片索引，天然支持中文等 CJK 语言的子串检索
 *   （better-sqlite3 捆绑的 SQLite 版本 >= 3.34，内置支持）
 * - 注意：trigram 仅支持长度 >= 3 个字符的查询，更短的查询由上层回退到文件扫描
 * @param db
 */
export const createFtsIndexDb = (db: Database) => {
  try {
    db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(
            title,
            content,
            tokenize='trigram'
        );
        `);
  } catch (error) {
    console.error('创建FTS索引表失败:', error);
  }
}


/**
 * 创建用户配置表
 */
export const createConfigDb = (db: Database) => {
  db.exec(`
            CREATE TABLE IF NOT EXISTS user_config (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              config_key TEXT NOT NULL UNIQUE,
              config_value TEXT,
              config_type TEXT DEFAULT 'string',
              description TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_config_key ON user_config (config_key);
          `)
}


/**
 * 创建AI工具表
 * 存储用户自定义的AI工具配置
 * @param db 
 */
export const createAIToolsDb = (db: Database) => {
  db.exec(`
            CREATE TABLE IF NOT EXISTS ai_tools (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              prompt TEXT NOT NULL,
              emoji TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `)
}

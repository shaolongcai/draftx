/**
 * 负责数据库的表定义以及创建、添加字段
 */
import { Database } from 'better-sqlite3'


/**
 * 存储便利贴的标题、内容、创建时间、修改时间、删除时间、最后访问时间、点击次数、标签
 * @param db 
 */
export const createStickysDb = (db: Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS stickys (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              uuid TEXT UNIQUE,
              title TEXT,
              content TEXT NOT NULL,
              content_string TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              deleted_at DATETIME,
              last_access_time DATETIME,
              click_count INTEGER,
              tags TEXT DEFAULT '[]'
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_stickys_uuid ON stickys (uuid);
          `)
}


/**
 * 创建文件全文搜索FTS5虚拟表（影子表）
 * 用于倒排索引和全文内容搜索
 * @param db 
 */
export const createStickysFtsDb = (db: Database) => {
    try {
        // 1) 清理旧 FTS 与触发器，避免历史残留导致冲突（数据重建时使用）
        // db.exec(`
        // DROP TRIGGER IF EXISTS files_fts_ai;
        // DROP TRIGGER IF EXISTS files_fts_au;
        // DROP TRIGGER IF EXISTS files_fts_delete;
        // DROP TABLE IF EXISTS files_fts;
        // `);


        // 2) 重建 FTS（修正 tokenize 写法，去掉 IF NOT EXISTS 以提升兼容） content为便利贴的全文内容
        db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS stickys_fts USING fts5(
            content,
            content=stickys,
            content_rowid=id,
            tokenize='unicode61 remove_diacritics 2'
        );
        `);

        // 3) 触发器采用 delete 哨兵 + insert 的推荐写法（不使用任何表别名）
        db.exec(`
        CREATE TRIGGER IF NOT EXISTS stickys_fts_ai AFTER INSERT ON stickys FOR EACH ROW BEGIN
          INSERT INTO stickys_fts(rowid, content)
          VALUES (new.id, new.content);
        END;
        `);

        db.exec(`
        CREATE TRIGGER IF NOT EXISTS stickys_fts_au AFTER UPDATE ON stickys FOR EACH ROW BEGIN
          INSERT INTO stickys_fts(stickys_fts, rowid) VALUES('delete', old.id);
          INSERT INTO stickys_fts(rowid, content) VALUES (new.id, new.content);
        END;
        `);

        db.exec(`
        CREATE TRIGGER IF NOT EXISTS stickys_fts_delete AFTER DELETE ON stickys FOR EACH ROW BEGIN
          INSERT INTO stickys_fts(stickys_fts, rowid) VALUES('delete', old.id);
        END;
        `);

        // 4) 初始化回填，确保 FTS 与 stickys 同步，避免空索引或歧义（能够回填数据）
        db.exec(`
        INSERT INTO stickys_fts(rowid, content)
        SELECT id, content FROM stickys WHERE content IS NOT NULL;
        `);
    } catch (error) {
        console.error('创建FTS表失败:', error);
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
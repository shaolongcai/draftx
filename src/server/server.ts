import * as sqlite3 from 'sqlite3';
import * as path from 'path';

// 数据库初始化
const dbPath = path.join(__dirname, '../../data/app.db');
const db = new sqlite3.Database(dbPath);

// 创建用户表
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// 数据库操作封装
export const Database = {
  // 获取所有用户
  getAllUsers: (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // 添加用户
  addUser: (username: string, email: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO users (username, email) VALUES (?, ?)', [username, email], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  // 删除用户
  deleteUser: (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// 简单的 HTTP 服务器（可选）
export const startServer = (port: number = 3001) => {
  console.log(`Database server ready on port ${port}`);
};

// 关闭数据库连接
export const closeDatabase = () => {
  db.close();
};
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/linkhub.db');
const dbDir = path.dirname(dbPath);

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// 启用 WAL 模式以提高并发性能
db.pragma('journal_mode = WAL');

// 初始化数据库表
function initDatabase() {
  // 创建 links 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      target_url TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_short_code ON links(short_code);
    CREATE INDEX IF NOT EXISTS idx_is_active ON links(is_active);
    CREATE INDEX IF NOT EXISTS idx_created_at ON links(created_at);
  `);

  // 创建 access_logs 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT,
      referer TEXT,
      FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
    )
  `);

  // 创建访问日志索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_link_id ON access_logs(link_id);
    CREATE INDEX IF NOT EXISTS idx_access_time ON access_logs(access_time);
  `);

  // 创建触发器：自动更新 updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_links_timestamp 
    AFTER UPDATE ON links
    FOR EACH ROW
    BEGIN
      UPDATE links SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  console.log('数据库初始化完成');
}

// 初始化数据库
initDatabase();

// 导出数据库实例
module.exports = db;
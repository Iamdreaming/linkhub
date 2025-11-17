// {{CODE-Cycle-Integration:
//   Task_ID: [#T001]
//   Timestamp: 2025-11-17T15:31:10Z
//   Phase: [D-Develop]
//   Context-Analysis: "增强数据库初始化错误处理，提供详细的诊断信息"
//   Principle_Applied: "Advanced-Debugging-Protocol, Verification-Mindset"
// }}
// {{START_MODIFICATIONS}}
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/linkhub.db');
const dbDir = path.dirname(dbPath);

console.log('=== 数据库初始化 ===');
console.log('数据库路径:', dbPath);
console.log('数据库目录:', dbDir);

// 确保数据目录存在
try {
  if (!fs.existsSync(dbDir)) {
    console.log('数据目录不存在，正在创建...');
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✓ 数据目录创建成功');
  } else {
    console.log('✓ 数据目录已存在');
  }

  // 检查目录权限
  fs.accessSync(dbDir, fs.constants.W_OK);
  console.log('✓ 数据目录可写');
} catch (error) {
  console.error('✗ 数据目录权限错误:', error.message);
  console.error('  目录路径:', dbDir);
  console.error('  当前用户:', process.env.USER || process.getuid?.() || 'unknown');
  console.error('  解决方案:');
  console.error('  1. 检查目录权限: ls -la', path.dirname(dbDir));
  console.error('  2. 如果使用 Docker，确保卷挂载正确');
  console.error('  3. 尝试删除并重新创建数据目录');
  throw error;
}

// 创建数据库连接
let db;
try {
  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null
  });
  console.log('✓ 数据库连接成功');
} catch (error) {
  console.error('✗ 数据库连接失败:', error.message);
  console.error('  错误代码:', error.code);
  console.error('  数据库路径:', dbPath);
  
  if (error.code === 'SQLITE_CANTOPEN') {
    console.error('  这通常是权限问题。请检查:');
    console.error('  1. 数据目录是否存在:', dbDir);
    console.error('  2. 当前用户是否有写入权限');
    console.error('  3. 如果使用 Docker，检查卷挂载配置');
    console.error('  4. 尝试手动创建测试文件: touch', path.join(dbDir, '.test'));
  }
  
  throw error;
}
// {{END_MODIFICATIONS}}

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
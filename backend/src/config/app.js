require('dotenv').config();

module.exports = {
  // 应用配置
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },

  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    adminPassword: process.env.ADMIN_PASSWORD || 'xIhz9xN$c*!p9T',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 86400 // 24小时
  },

  // 数据库配置
  database: {
    path: process.env.DB_PATH || './data/linkhub.db',
    backupPath: process.env.DB_BACKUP_PATH || './data/backups'
  },

  // 备份配置
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 3 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
  },

  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    redirectMax: parseInt(process.env.REDIRECT_RATE_LIMIT_MAX) || 10
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 7
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // 二维码配置
  qrcode: {
    defaultSize: parseInt(process.env.QR_DEFAULT_SIZE) || 300,
    maxSize: parseInt(process.env.QR_MAX_SIZE) || 1000,
    minSize: parseInt(process.env.QR_MIN_SIZE) || 100
  }
};
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const config = require('./config/app');
const logger = require('./utils/logger');
const backupService = require('./services/backupService');

// 路由
const apiRoutes = require('./routes/api');
const redirectRoutes = require('./routes/redirect');

// 中间件
const { apiLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 创建 Express 应用
const app = express();

// ============ 安全中间件 ============
app.use(helmet({
  contentSecurityPolicy: false, // 允许内联脚本（用于前端）
  crossOriginEmbedderPolicy: false
}));

// ============ CORS 配置 ============
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));

// ============ 请求解析 ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ 请求日志 ============
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP请求', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// ============ 静态文件服务 ============
app.use(express.static(path.join(__dirname, '../public')));

// ============ API 路由 ============
app.use('/api', apiLimiter, apiRoutes);

// ============ 短链重定向路由 ============
app.use('/r', redirectRoutes);

// ============ 前端路由（SPA） ============
app.get('*', (req, res, next) => {
  // 如果是 API 请求，跳过
  if (req.url.startsWith('/api') || req.url.startsWith('/r')) {
    return next();
  }
  
  // 返回前端应用
  const indexPath = path.join(__dirname, '../public/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // 如果前端文件不存在，返回简单的欢迎页面
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LinkHub - 微信转链工具</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255,255,255,0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 3em; margin: 0; }
            p { font-size: 1.2em; margin: 20px 0; }
            .status { 
              display: inline-block;
              padding: 10px 20px;
              background: rgba(255,255,255,0.2);
              border-radius: 20px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔗 LinkHub</h1>
            <p>微信转链工具后端服务</p>
            <div class="status">✅ 服务运行中</div>
            <p style="font-size: 0.9em; margin-top: 30px;">
              API 地址: <code>${config.app.baseUrl}/api</code>
            </p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// ============ 404 处理 ============
app.use(notFoundHandler);

// ============ 错误处理 ============
app.use(errorHandler);

// ============ 启动服务器 ============
const PORT = config.app.port;

async function startServer() {
  try {
    // 初始化备份服务
    await backupService.initialize();
    logger.info('备份服务已初始化');

    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`服务器启动成功`, {
        port: PORT,
        env: config.app.env,
        baseUrl: config.app.baseUrl
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('🚀 LinkHub 服务器已启动');
      console.log('='.repeat(60));
      console.log(`📍 地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${config.app.env}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`🔗 短链: http://localhost:${PORT}/r/{shortCode}`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    logger.error('服务器启动失败', { error: error.message });
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，准备关闭服务器');
  backupService.stopScheduledBackup();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，准备关闭服务器');
  backupService.stopScheduledBackup();
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
const express = require('express');
const router = express.Router();
const LinkService = require('../services/linkService');
const StatsService = require('../services/statsService');
const { redirectLimiter } = require('../middleware/rateLimit');
const logger = require('../utils/logger');

/**
 * 短链重定向
 */
router.get('/:shortCode', redirectLimiter, async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // 查找链接
    const link = await LinkService.getLinkByShortCode(shortCode);

    // 检查链接是否启用
    if (!link.isActive) {
      logger.warn('访问已禁用的链接', { shortCode, ip: req.ip });
      return res.status(410).send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>链接已禁用</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #e74c3c; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>链接已禁用</h1>
            <p>抱歉，此链接已被管理员禁用。</p>
          </div>
        </body>
        </html>
      `);
    }

    // 记录访问日志（异步，不阻塞重定向）
    StatsService.logAccess(link.id, req).catch(error => {
      logger.error('记录访问日志失败', { linkId: link.id, error: error.message });
    });

    // 重定向到目标URL
    logger.info('短链重定向', { shortCode, targetUrl: link.targetUrl, ip: req.ip });
    res.redirect(302, link.targetUrl);

  } catch (error) {
    if (error.name === 'NotFoundError') {
      logger.warn('访问不存在的短链', { shortCode: req.params.shortCode, ip: req.ip });
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>链接不存在</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #e67e22; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>链接不存在</h1>
            <p>抱歉，您访问的链接不存在或已被删除。</p>
          </div>
        </body>
        </html>
      `);
    }
    next(error);
  }
});

module.exports = router;
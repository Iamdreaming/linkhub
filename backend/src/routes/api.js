const express = require('express');
const router = express.Router();

// 控制器
const AuthController = require('../controllers/authController');
const LinkController = require('../controllers/linkController');
const StatsController = require('../controllers/statsController');
const BackupController = require('../controllers/backupController');

// 中间件
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter, loginLimiter, qrcodeLimiter } = require('../middleware/rateLimit');

// ============ 认证路由 ============
router.post('/auth/login', loginLimiter, AuthController.login);
router.get('/auth/verify', authMiddleware, AuthController.verify);
router.post('/auth/logout', authMiddleware, AuthController.logout);

// ============ 链接管理路由 ============
router.get('/links', authMiddleware, LinkController.getLinks);
router.post('/links', authMiddleware, LinkController.createLink);
router.get('/links/:id', authMiddleware, LinkController.getLink);
router.put('/links/:id', authMiddleware, LinkController.updateLink);
router.delete('/links/:id', authMiddleware, LinkController.deleteLink);

// 批量操作
router.post('/links/batch', authMiddleware, LinkController.batchOperation);

// 检查短链可用性
router.get('/links/check/:shortCode', authMiddleware, LinkController.checkAvailability);

// ============ 二维码路由 ============
router.get('/links/:id/qrcode', qrcodeLimiter, LinkController.getQRCode);
router.post('/qrcodes/batch', authMiddleware, qrcodeLimiter, LinkController.batchDownloadQRCodes);

// ============ 统计路由 ============
router.get('/links/:id/stats', authMiddleware, StatsController.getLinkStats);
router.get('/links/:id/logs', authMiddleware, StatsController.getAccessLogs);
router.get('/links/:id/trend', authMiddleware, StatsController.getTrendAnalysis);
router.get('/links/:id/export', authMiddleware, StatsController.exportStats);

router.get('/stats/overview', authMiddleware, StatsController.getOverviewStats);
router.post('/stats/clean', authMiddleware, StatsController.cleanOldLogs);

// ============ 备份路由 ============
router.post('/backup', authMiddleware, BackupController.createBackup);
router.get('/backups', authMiddleware, BackupController.getBackupList);
router.post('/backup/restore', authMiddleware, BackupController.restoreBackup);
router.delete('/backups/:filename', authMiddleware, BackupController.deleteBackup);
router.get('/backups/:filename/download', authMiddleware, BackupController.downloadBackup);
router.post('/backups/clean', authMiddleware, BackupController.cleanOldBackups);

// ============ 健康检查 ============
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
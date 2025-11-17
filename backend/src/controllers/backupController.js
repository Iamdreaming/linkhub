const backupService = require('../services/backupService');
const logger = require('../utils/logger');

class BackupController {
  /**
   * 创建备份
   */
  static async createBackup(req, res, next) {
    try {
      const backup = await backupService.createBackup();

      logger.info('手动创建备份', { filename: backup.filename });

      res.json({
        success: true,
        data: backup,
        message: '备份创建成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取备份列表
   */
  static async getBackupList(req, res, next) {
    try {
      const result = await backupService.getBackupList();

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 恢复备份
   */
  static async restoreBackup(req, res, next) {
    try {
      const { filename } = req.body;

      if (!filename) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请提供备份文件名'
          }
        });
      }

      const result = await backupService.restoreBackup(filename);

      logger.info('恢复备份', { filename });

      res.json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除备份
   */
  static async deleteBackup(req, res, next) {
    try {
      const { filename } = req.params;

      const result = await backupService.deleteBackup(filename);

      logger.info('删除备份', { filename });

      res.json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 下载备份
   */
  static async downloadBackup(req, res, next) {
    try {
      const { filename } = req.params;

      const filePath = await backupService.downloadBackup(filename);

      res.download(filePath, filename, (err) => {
        if (err) {
          logger.error('下载备份失败', { filename, error: err.message });
          next(err);
        } else {
          logger.info('下载备份', { filename });
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 清理过期备份
   */
  static async cleanOldBackups(req, res, next) {
    try {
      const result = await backupService.cleanOldBackups();

      logger.info('清理过期备份', { deleted: result.deleted });

      res.json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BackupController;
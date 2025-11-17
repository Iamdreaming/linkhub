const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const config = require('../config/app');
const logger = require('../utils/logger');

class BackupService {
  constructor() {
    this.backupPath = config.database.backupPath;
    this.dbPath = config.database.path;
    this.retentionDays = config.backup.retentionDays;
    this.cronJob = null;
  }

  /**
   * 初始化备份服务
   */
  async initialize() {
    // 确保备份目录存在
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
      logger.info('备份目录已创建');
    } catch (error) {
      logger.error('创建备份目录失败:', error);
    }

    // 启动定时备份
    if (config.backup.enabled) {
      this.startScheduledBackup();
    }
  }

  /**
   * 启动定时备份
   */
  startScheduledBackup() {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    this.cronJob = cron.schedule(config.backup.schedule, async () => {
      try {
        logger.info('开始执行定时备份...');
        await this.createBackup();
        await this.cleanOldBackups();
        logger.info('定时备份完成');
      } catch (error) {
        logger.error('定时备份失败:', error);
      }
    });

    logger.info(`定时备份已启动，计划: ${config.backup.schedule}`);
  }

  /**
   * 停止定时备份
   */
  stopScheduledBackup() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('定时备份已停止');
    }
  }

  /**
   * 创建备份
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupFileName = `backup-${timestamp}.db`;
      const backupFilePath = path.join(this.backupPath, backupFileName);

      // 复制数据库文件
      await fs.copyFile(this.dbPath, backupFilePath);

      // 获取文件大小
      const stats = await fs.stat(backupFilePath);

      logger.info(`备份创建成功: ${backupFileName}`);

      return {
        filename: backupFileName,
        path: backupFilePath,
        size: stats.size,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('创建备份失败:', error);
      throw new Error(`备份创建失败: ${error.message}`);
    }
  }

  /**
   * 获取备份列表
   */
  async getBackupList() {
    try {
      const files = await fs.readdir(this.backupPath);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.db')) {
          const filePath = path.join(this.backupPath, file);
          const stats = await fs.stat(filePath);

          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime.toISOString()
          });
        }
      }

      // 按创建时间倒序排序
      backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

      return {
        backups,
        total: backups.length,
        totalSize
      };
    } catch (error) {
      logger.error('获取备份列表失败:', error);
      throw new Error(`获取备份列表失败: ${error.message}`);
    }
  }

  /**
   * 恢复备份
   */
  async restoreBackup(filename) {
    try {
      const backupFilePath = path.join(this.backupPath, filename);

      // 检查备份文件是否存在
      try {
        await fs.access(backupFilePath);
      } catch {
        throw new Error('备份文件不存在');
      }

      // 创建当前数据库的临时备份
      const tempBackup = `${this.dbPath}.temp`;
      await fs.copyFile(this.dbPath, tempBackup);

      try {
        // 恢复备份
        await fs.copyFile(backupFilePath, this.dbPath);
        
        // 删除临时备份
        await fs.unlink(tempBackup);

        logger.info(`备份恢复成功: ${filename}`);

        return {
          success: true,
          message: '备份恢复成功，请重启服务以生效'
        };
      } catch (error) {
        // 恢复失败，回滚到临时备份
        await fs.copyFile(tempBackup, this.dbPath);
        await fs.unlink(tempBackup);
        throw error;
      }
    } catch (error) {
      logger.error('恢复备份失败:', error);
      throw new Error(`恢复备份失败: ${error.message}`);
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(filename) {
    try {
      const backupFilePath = path.join(this.backupPath, filename);

      // 检查文件是否存在
      try {
        await fs.access(backupFilePath);
      } catch {
        throw new Error('备份文件不存在');
      }

      // 删除文件
      await fs.unlink(backupFilePath);

      logger.info(`备份已删除: ${filename}`);

      return {
        success: true,
        message: '备份删除成功'
      };
    } catch (error) {
      logger.error('删除备份失败:', error);
      throw new Error(`删除备份失败: ${error.message}`);
    }
  }

  /**
   * 清理过期备份
   */
  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupPath);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.db')) {
          const filePath = path.join(this.backupPath, file);
          const stats = await fs.stat(filePath);
          const age = now - stats.birthtime.getTime();

          if (age > retentionMs) {
            await fs.unlink(filePath);
            deletedCount++;
            logger.info(`已删除过期备份: ${file}`);
          }
        }
      }

      if (deletedCount > 0) {
        logger.info(`清理完成，共删除 ${deletedCount} 个过期备份`);
      }

      return {
        deleted: deletedCount,
        message: `已清理 ${deletedCount} 个过期备份`
      };
    } catch (error) {
      logger.error('清理过期备份失败:', error);
      throw new Error(`清理过期备份失败: ${error.message}`);
    }
  }

  /**
   * 下载备份
   */
  async downloadBackup(filename) {
    try {
      const backupFilePath = path.join(this.backupPath, filename);

      // 检查文件是否存在
      try {
        await fs.access(backupFilePath);
      } catch {
        throw new Error('备份文件不存在');
      }

      return backupFilePath;
    } catch (error) {
      logger.error('下载备份失败:', error);
      throw new Error(`下载备份失败: ${error.message}`);
    }
  }
}

// 创建单例实例
const backupService = new BackupService();

module.exports = backupService;
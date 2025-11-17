const StatsService = require('../services/statsService');
const logger = require('../utils/logger');

class StatsController {
  /**
   * 获取链接统计
   */
  static async getLinkStats(req, res, next) {
    try {
      const { id } = req.params;
      const { period = '7d' } = req.query;

      const stats = await StatsService.getLinkStats(id, period);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取总体统计
   */
  static async getOverviewStats(req, res, next) {
    try {
      const stats = await StatsService.getOverviewStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取访问日志
   */
  static async getAccessLogs(req, res, next) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      const logs = await StatsService.getAccessLogs(id, { limit, offset });

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 导出统计数据
   */
  static async exportStats(req, res, next) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const csvData = await StatsService.exportStats(id, period);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=stats-${id}-${period}.csv`);
      res.send(csvData);

      logger.info('导出统计数据', { linkId: id, period });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取访问趋势分析
   */
  static async getTrendAnalysis(req, res, next) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const trend = await StatsService.getTrendAnalysis(id, period);

      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 清理过期日志
   */
  static async cleanOldLogs(req, res, next) {
    try {
      const { days = 90 } = req.body;

      const result = await StatsService.cleanOldLogs(days);

      logger.info('清理过期日志', { days, deleted: result.deleted });

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

module.exports = StatsController;
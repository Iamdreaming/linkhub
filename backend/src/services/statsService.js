const AccessLog = require('../models/AccessLog');
const Link = require('../models/Link');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { validatePeriod } = require('../utils/validator');

class StatsService {
  /**
   * 记录访问日志
   */
  static async logAccess(linkId, req) {
    // 获取访问信息
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const referer = req.get('referer') || null;

    // 记录日志
    const logId = AccessLog.create({
      linkId,
      ipAddress,
      userAgent,
      referer
    });

    return logId;
  }

  /**
   * 获取链接统计
   */
  static async getLinkStats(linkId, period = '7d') {
    // 验证链接是否存在
    const link = Link.findById(linkId);
    if (!link) {
      throw new NotFoundError('链接不存在');
    }

    // 验证周期参数
    const periodValidation = validatePeriod(period);
    if (!periodValidation.valid) {
      throw new ValidationError(periodValidation.message);
    }

    // 获取统计数据
    const stats = AccessLog.getStats(linkId, period);

    // 补充链接信息
    return {
      linkInfo: {
        id: link.id,
        shortCode: link.shortCode,
        name: link.name,
        targetUrl: link.targetUrl
      },
      summary: {
        totalAccess: stats.total,
        periodAccess: stats.periodCount,
        todayAccess: stats.todayCount,
        avgDailyAccess: stats.dailyStats.length > 0
          ? (stats.periodCount / stats.dailyStats.length).toFixed(1)
          : 0
      },
      dailyStats: stats.dailyStats,
      hourlyStats: this._fillHourlyStats(stats.hourlyStats),
      topReferers: stats.topReferers,
      recentAccess: stats.recentAccess
    };
  }

  /**
   * 获取总体统计
   */
  static async getOverviewStats() {
    const stats = AccessLog.getOverviewStats();

    return {
      totalLinks: stats.totalLinks,
      activeLinks: stats.activeLinks,
      totalAccess: stats.totalAccess,
      todayAccess: stats.todayAccess,
      weekAccess: stats.weekAccess,
      monthAccess: stats.monthAccess,
      topLinks: stats.topLinks,
      recentActivity: stats.recentActivity
    };
  }

  /**
   * 获取访问日志
   */
  static async getAccessLogs(linkId, options = {}) {
    // 验证链接是否存在
    const link = Link.findById(linkId);
    if (!link) {
      throw new NotFoundError('链接不存在');
    }

    const { limit = 100, offset = 0 } = options;

    const logs = AccessLog.findByLinkId(linkId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return logs;
  }

  /**
   * 清理过期日志
   */
  static async cleanOldLogs(days = 90) {
    const deleted = AccessLog.cleanOldLogs(days);
    return {
      deleted,
      message: `已清理 ${deleted} 条过期日志`
    };
  }

  /**
   * 导出统计数据
   */
  static async exportStats(linkId, period = '30d') {
    const stats = await this.getLinkStats(linkId, period);
    
    // 转换为CSV格式
    const csvData = this._convertToCSV(stats);
    
    return csvData;
  }

  /**
   * 填充24小时统计数据（补全缺失的小时）
   */
  static _fillHourlyStats(hourlyStats) {
    const filled = Array(24).fill(0).map((_, hour) => ({
      hour,
      count: 0
    }));

    hourlyStats.forEach(stat => {
      filled[stat.hour] = stat;
    });

    return filled;
  }

  /**
   * 转换统计数据为CSV格式
   */
  static _convertToCSV(stats) {
    const lines = [];
    
    // 标题行
    lines.push('日期,访问量,独立IP');
    
    // 数据行
    stats.dailyStats.forEach(stat => {
      lines.push(`${stat.date},${stat.count},${stat.uniqueIp}`);
    });
    
    return lines.join('\n');
  }

  /**
   * 获取访问趋势分析
   */
  static async getTrendAnalysis(linkId, period = '30d') {
    const stats = await this.getLinkStats(linkId, period);
    
    // 计算趋势
    const dailyStats = stats.dailyStats;
    if (dailyStats.length < 2) {
      return {
        trend: 'stable',
        change: 0,
        message: '数据不足，无法分析趋势'
      };
    }

    // 计算前半段和后半段的平均值
    const midPoint = Math.floor(dailyStats.length / 2);
    const firstHalf = dailyStats.slice(0, midPoint);
    const secondHalf = dailyStats.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.count, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);

    let trend = 'stable';
    let message = '访问量保持稳定';

    if (change > 10) {
      trend = 'up';
      message = `访问量上升 ${change}%`;
    } else if (change < -10) {
      trend = 'down';
      message = `访问量下降 ${Math.abs(change)}%`;
    }

    return {
      trend,
      change: parseFloat(change),
      message,
      firstHalfAvg: firstAvg.toFixed(1),
      secondHalfAvg: secondAvg.toFixed(1)
    };
  }
}

module.exports = StatsService;
const db = require('../config/database');

class AccessLog {
  /**
   * 记录访问日志
   */
  static create({ linkId, ipAddress, userAgent, referer }) {
    const stmt = db.prepare(`
      INSERT INTO access_logs (link_id, ip_address, user_agent, referer)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(linkId, ipAddress, userAgent, referer);
    return result.lastInsertRowid;
  }

  /**
   * 获取链接的访问日志
   */
  static findByLinkId(linkId, { limit = 100, offset = 0 } = {}) {
    const stmt = db.prepare(`
      SELECT 
        id,
        link_id as linkId,
        access_time as accessTime,
        ip_address as ipAddress,
        user_agent as userAgent,
        referer
      FROM access_logs
      WHERE link_id = ?
      ORDER BY access_time DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(linkId, limit, offset);
  }

  /**
   * 获取链接的访问统计
   */
  static getStats(linkId, period = '7d') {
    const startDate = this._getStartDate(period);
    
    // 总访问量
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM access_logs
      WHERE link_id = ?
    `);
    const { total } = totalStmt.get(linkId);
    
    // 周期内访问量
    const periodStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM access_logs
      WHERE link_id = ? AND access_time >= ?
    `);
    const { count: periodCount } = periodStmt.get(linkId, startDate);
    
    // 今日访问量
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM access_logs
      WHERE link_id = ? AND access_time >= ?
    `);
    const { count: todayCount } = todayStmt.get(linkId, todayStart.toISOString());
    
    // 按日期统计
    const dailyStmt = db.prepare(`
      SELECT 
        DATE(access_time) as date,
        COUNT(*) as count,
        COUNT(DISTINCT ip_address) as uniqueIp
      FROM access_logs
      WHERE link_id = ? AND access_time >= ?
      GROUP BY DATE(access_time)
      ORDER BY date DESC
    `);
    const dailyStats = dailyStmt.all(linkId, startDate);
    
    // 按小时统计（最近24小时）
    const hourlyStmt = db.prepare(`
      SELECT 
        CAST(strftime('%H', access_time) AS INTEGER) as hour,
        COUNT(*) as count
      FROM access_logs
      WHERE link_id = ? AND access_time >= datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour
    `);
    const hourlyStats = hourlyStmt.all(linkId);
    
    // 来源统计
    const refererStmt = db.prepare(`
      SELECT 
        COALESCE(referer, 'direct') as referer,
        COUNT(*) as count
      FROM access_logs
      WHERE link_id = ? AND access_time >= ?
      GROUP BY referer
      ORDER BY count DESC
      LIMIT 10
    `);
    const topReferers = refererStmt.all(linkId, startDate);
    
    // 最近访问记录
    const recentStmt = db.prepare(`
      SELECT 
        access_time as accessTime,
        ip_address as ipAddress,
        user_agent as userAgent,
        referer
      FROM access_logs
      WHERE link_id = ?
      ORDER BY access_time DESC
      LIMIT 20
    `);
    const recentAccess = recentStmt.all(linkId);
    
    return {
      total,
      periodCount,
      todayCount,
      dailyStats,
      hourlyStats,
      topReferers,
      recentAccess
    };
  }

  /**
   * 获取总体统计
   */
  static getOverviewStats() {
    // 总链接数
    const linksStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM links
    `);
    const linksCount = linksStmt.get();
    
    // 总访问量
    const totalAccessStmt = db.prepare('SELECT COUNT(*) as total FROM access_logs');
    const { total: totalAccess } = totalAccessStmt.get();
    
    // 今日访问量
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM access_logs
      WHERE access_time >= ?
    `);
    const { count: todayAccess } = todayStmt.get(todayStart.toISOString());
    
    // 本周访问量
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM access_logs
      WHERE access_time >= ?
    `);
    const { count: weekAccess } = weekStmt.get(weekStart.toISOString());
    
    // 本月访问量
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    const monthStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM access_logs
      WHERE access_time >= ?
    `);
    const { count: monthAccess } = monthStmt.get(monthStart.toISOString());
    
    // 访问量最多的链接
    const topLinksStmt = db.prepare(`
      SELECT 
        l.id,
        l.short_code as shortCode,
        l.name,
        COUNT(al.id) as accessCount
      FROM links l
      LEFT JOIN access_logs al ON l.id = al.link_id
      GROUP BY l.id
      ORDER BY accessCount DESC
      LIMIT 10
    `);
    const topLinks = topLinksStmt.all();
    
    // 最近活动
    const recentActivityStmt = db.prepare(`
      SELECT 
        l.id as linkId,
        l.name as linkName,
        l.short_code as shortCode,
        al.access_time as accessTime
      FROM access_logs al
      JOIN links l ON al.link_id = l.id
      ORDER BY al.access_time DESC
      LIMIT 20
    `);
    const recentActivity = recentActivityStmt.all();
    
    return {
      totalLinks: linksCount.total,
      activeLinks: linksCount.active,
      totalAccess,
      todayAccess,
      weekAccess,
      monthAccess,
      topLinks,
      recentActivity
    };
  }

  /**
   * 清理过期日志
   */
  static cleanOldLogs(days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const stmt = db.prepare(`
      DELETE FROM access_logs
      WHERE access_time < ?
    `);
    
    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  /**
   * 获取开始日期（根据周期）
   */
  static _getStartDate(period) {
    const now = new Date();
    
    switch (period) {
      case '24h':
        now.setHours(now.getHours() - 24);
        break;
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      case 'all':
        return '1970-01-01';
      default:
        now.setDate(now.getDate() - 7);
    }
    
    return now.toISOString();
  }
}

module.exports = AccessLog;
const db = require('../config/database');

class Link {
  /**
   * 创建新链接
   */
  static create({ shortCode, name, targetUrl, description = null, isActive = true }) {
    const stmt = db.prepare(`
      INSERT INTO links (short_code, name, target_url, description, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(shortCode, name, targetUrl, description, isActive ? 1 : 0);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * 根据ID查找链接
   */
  static findById(id) {
    const stmt = db.prepare(`
      SELECT 
        id,
        short_code as shortCode,
        name,
        target_url as targetUrl,
        description,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt,
        (SELECT COUNT(*) FROM access_logs WHERE link_id = links.id) as accessCount,
        (SELECT MAX(access_time) FROM access_logs WHERE link_id = links.id) as lastAccessAt
      FROM links
      WHERE id = ?
    `);
    
    return stmt.get(id);
  }

  /**
   * 根据短链代码查找链接
   */
  static findByShortCode(shortCode) {
    const stmt = db.prepare(`
      SELECT 
        id,
        short_code as shortCode,
        name,
        target_url as targetUrl,
        description,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM links
      WHERE short_code = ?
    `);
    
    return stmt.get(shortCode);
  }

  /**
   * 获取所有链接（支持分页和搜索）
   */
  static findAll({ page = 1, limit = 20, search = '', status = 'all', sortBy = 'createdAt', sortOrder = 'desc' }) {
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = '1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR short_code LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (status === 'active') {
      whereClause += ' AND is_active = 1';
    } else if (status === 'inactive') {
      whereClause += ' AND is_active = 0';
    }
    
    // 排序字段映射
    const sortFieldMap = {
      createdAt: 'created_at',
      name: 'name',
      accessCount: 'access_count'
    };
    const sortField = sortFieldMap[sortBy] || 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // 查询总数
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM links
      WHERE ${whereClause}
    `);
    const { total } = countStmt.get(...params);
    
    // 查询数据
    const stmt = db.prepare(`
      SELECT 
        id,
        short_code as shortCode,
        name,
        target_url as targetUrl,
        description,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt,
        (SELECT COUNT(*) FROM access_logs WHERE link_id = links.id) as accessCount,
        (SELECT MAX(access_time) FROM access_logs WHERE link_id = links.id) as lastAccessAt
      FROM links
      WHERE ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT ? OFFSET ?
    `);
    
    const links = stmt.all(...params, limit, offset);
    
    return {
      links,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 更新链接
   */
  static update(id, { name, targetUrl, description, isActive }) {
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (targetUrl !== undefined) {
      updates.push('target_url = ?');
      params.push(targetUrl);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return this.findById(id);
    }
    
    params.push(id);
    
    const stmt = db.prepare(`
      UPDATE links
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...params);
    return this.findById(id);
  }

  /**
   * 删除链接
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM links WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 批量更新状态
   */
  static batchUpdateStatus(ids, isActive) {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`
      UPDATE links
      SET is_active = ?
      WHERE id IN (${placeholders})
    `);
    
    const result = stmt.run(isActive ? 1 : 0, ...ids);
    return result.changes;
  }

  /**
   * 批量删除
   */
  static batchDelete(ids) {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`
      DELETE FROM links
      WHERE id IN (${placeholders})
    `);
    
    const result = stmt.run(...ids);
    return result.changes;
  }

  /**
   * 检查短链代码是否存在
   */
  static exists(shortCode) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM links WHERE short_code = ?');
    const { count } = stmt.get(shortCode);
    return count > 0;
  }
}

module.exports = Link;
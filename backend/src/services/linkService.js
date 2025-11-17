const Link = require('../models/Link');
const { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} = require('../middleware/errorHandler');
const {
  validateShortCode,
  validateLinkName,
  validateTargetUrl,
  validateDescription
} = require('../utils/validator');

class LinkService {
  /**
   * 创建新链接
   */
  static async createLink({ shortCode, name, targetUrl, description, isActive = true }) {
    // 验证输入
    const shortCodeValidation = validateShortCode(shortCode);
    if (!shortCodeValidation.valid) {
      throw new ValidationError(shortCodeValidation.message);
    }

    const nameValidation = validateLinkName(name);
    if (!nameValidation.valid) {
      throw new ValidationError(nameValidation.message);
    }

    const urlValidation = validateTargetUrl(targetUrl);
    if (!urlValidation.valid) {
      throw new ValidationError(urlValidation.message);
    }

    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      throw new ValidationError(descValidation.message);
    }

    // 检查短链代码是否已存在
    if (Link.exists(shortCode)) {
      throw new ConflictError('短链代码已存在');
    }

    // 创建链接
    const link = Link.create({
      shortCode,
      name,
      targetUrl,
      description,
      isActive
    });

    return link;
  }

  /**
   * 获取链接列表
   */
  static async getLinks(params) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    return Link.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      sortBy,
      sortOrder
    });
  }

  /**
   * 根据ID获取链接
   */
  static async getLinkById(id) {
    const link = Link.findById(id);
    
    if (!link) {
      throw new NotFoundError('链接不存在');
    }

    return link;
  }

  /**
   * 根据短链代码获取链接
   */
  static async getLinkByShortCode(shortCode) {
    const link = Link.findByShortCode(shortCode);
    
    if (!link) {
      throw new NotFoundError('链接不存在');
    }

    return link;
  }

  /**
   * 更新链接
   */
  static async updateLink(id, updates) {
    // 检查链接是否存在
    const existingLink = Link.findById(id);
    if (!existingLink) {
      throw new NotFoundError('链接不存在');
    }

    // 验证更新数据
    if (updates.name !== undefined) {
      const nameValidation = validateLinkName(updates.name);
      if (!nameValidation.valid) {
        throw new ValidationError(nameValidation.message);
      }
    }

    if (updates.targetUrl !== undefined) {
      const urlValidation = validateTargetUrl(updates.targetUrl);
      if (!urlValidation.valid) {
        throw new ValidationError(urlValidation.message);
      }
    }

    if (updates.description !== undefined) {
      const descValidation = validateDescription(updates.description);
      if (!descValidation.valid) {
        throw new ValidationError(descValidation.message);
      }
    }

    // 更新链接
    const updatedLink = Link.update(id, updates);
    return updatedLink;
  }

  /**
   * 删除链接
   */
  static async deleteLink(id) {
    // 检查链接是否存在
    const existingLink = Link.findById(id);
    if (!existingLink) {
      throw new NotFoundError('链接不存在');
    }

    const deleted = Link.delete(id);
    return deleted;
  }

  /**
   * 批量操作
   */
  static async batchOperation(action, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('请提供要操作的链接ID列表');
    }

    let affected = 0;
    const failed = [];

    switch (action) {
      case 'activate':
        affected = Link.batchUpdateStatus(ids, true);
        break;
      
      case 'deactivate':
        affected = Link.batchUpdateStatus(ids, false);
        break;
      
      case 'delete':
        affected = Link.batchDelete(ids);
        break;
      
      default:
        throw new ValidationError('无效的操作类型');
    }

    return {
      affected,
      failed
    };
  }

  /**
   * 检查短链代码是否可用
   */
  static async checkShortCodeAvailability(shortCode) {
    const validation = validateShortCode(shortCode);
    if (!validation.valid) {
      return {
        available: false,
        message: validation.message
      };
    }

    const exists = Link.exists(shortCode);
    return {
      available: !exists,
      message: exists ? '短链代码已被使用' : '短链代码可用'
    };
  }
}

module.exports = LinkService;
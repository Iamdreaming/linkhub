/**
 * 验证短链代码格式
 */
function validateShortCode(shortCode) {
  if (!shortCode || typeof shortCode !== 'string') {
    return { valid: false, message: '短链代码不能为空' };
  }
  
  if (shortCode.length < 3 || shortCode.length > 20) {
    return { valid: false, message: '短链代码长度必须在3-20个字符之间' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(shortCode)) {
    return { valid: false, message: '短链代码只能包含字母、数字和下划线' };
  }
  
  return { valid: true };
}

/**
 * 验证链接名称
 */
function validateLinkName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: '链接名称不能为空' };
  }
  
  if (name.length < 1 || name.length > 100) {
    return { valid: false, message: '链接名称长度必须在1-100个字符之间' };
  }
  
  return { valid: true };
}

/**
 * 验证目标URL
 */
function validateTargetUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, message: '目标链接不能为空' };
  }
  
  if (url.length > 2000) {
    return { valid: false, message: '目标链接长度不能超过2000个字符' };
  }
  
  return { valid: true };
}

/**
 * 验证描述
 */
function validateDescription(description) {
  if (description === null || description === undefined) {
    return { valid: true };
  }
  
  if (typeof description !== 'string') {
    return { valid: false, message: '描述必须是字符串' };
  }
  
  if (description.length > 500) {
    return { valid: false, message: '描述长度不能超过500个字符' };
  }
  
  return { valid: true };
}

/**
 * 验证分页参数
 */
function validatePagination(page, limit) {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return { valid: false, message: '页码必须是大于0的整数' };
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { valid: false, message: '每页数量必须在1-100之间' };
  }
  
  return { valid: true, page: pageNum, limit: limitNum };
}

/**
 * 验证二维码尺寸
 */
function validateQRSize(size, config) {
  const sizeNum = parseInt(size);
  
  if (isNaN(sizeNum)) {
    return { valid: false, message: '尺寸必须是数字' };
  }
  
  if (sizeNum < config.qrcode.minSize || sizeNum > config.qrcode.maxSize) {
    return { 
      valid: false, 
      message: `尺寸必须在${config.qrcode.minSize}-${config.qrcode.maxSize}之间` 
    };
  }
  
  return { valid: true, size: sizeNum };
}

/**
 * 验证统计周期
 */
function validatePeriod(period) {
  const validPeriods = ['24h', '7d', '30d', '90d', 'all'];
  
  if (!validPeriods.includes(period)) {
    return { valid: false, message: '无效的统计周期' };
  }
  
  return { valid: true };
}

/**
 * 清理和转义用户输入（防止XSS）
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

module.exports = {
  validateShortCode,
  validateLinkName,
  validateTargetUrl,
  validateDescription,
  validatePagination,
  validateQRSize,
  validatePeriod,
  sanitizeInput
};
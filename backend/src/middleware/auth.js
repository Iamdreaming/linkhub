const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * JWT 认证中间件
 */
function authMiddleware(req, res, next) {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未提供认证令牌'
        }
      });
    }
    
    // 验证 Bearer token 格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '认证令牌格式错误'
        }
      });
    }
    
    const token = parts[1];
    
    // 验证 token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '认证令牌无效或已过期'
        }
      });
    }
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '认证过程发生错误'
      }
    });
  }
}

/**
 * 可选认证中间件（token 存在时验证，不存在时继续）
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
    next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
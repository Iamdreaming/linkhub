const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const config = require('../config/app');
const { UnauthorizedError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthController {
  /**
   * 登录
   */
  static async login(req, res, next) {
    try {
      const { password } = req.body;

      if (!password) {
        throw new UnauthorizedError('请提供密码');
      }

      // 验证密码
      if (password !== config.security.adminPassword) {
        logger.warn('登录失败：密码错误', { ip: req.ip });
        throw new UnauthorizedError('密码错误');
      }

      // 生成 Token
      const token = generateToken({
        role: 'admin',
        loginAt: new Date().toISOString()
      });

      logger.info('登录成功', { ip: req.ip });

      res.json({
        success: true,
        data: {
          token,
          expiresIn: config.security.sessionTimeout
        },
        message: '登录成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 验证 Token
   */
  static async verify(req, res, next) {
    try {
      // Token 已经在中间件中验证
      res.json({
        success: true,
        data: {
          valid: true,
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 登出（客户端删除 Token）
   */
  static async logout(req, res, next) {
    try {
      logger.info('用户登出', { ip: req.ip });

      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
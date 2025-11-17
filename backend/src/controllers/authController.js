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

  /**
   * 重置密码
   */
  static async resetPassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        throw new UnauthorizedError('请提供旧密码和新密码');
      }

      // 验证旧密码
      if (oldPassword !== config.security.adminPassword) {
        logger.warn('密码重置失败：旧密码错误', { ip: req.ip });
        throw new UnauthorizedError('旧密码错误');
      }

      // 验证新密码强度
      if (newPassword.length < 6) {
        throw new UnauthorizedError('新密码长度至少为6位');
      }

      // 更新配置文件中的密码
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(__dirname, '../config/app.js');
      
      // 读取当前配置
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      // 替换密码
      configContent = configContent.replace(
        /adminPassword:\s*process\.env\.ADMIN_PASSWORD\s*\|\|\s*['"].*?['"]/,
        `adminPassword: process.env.ADMIN_PASSWORD || '${newPassword}'`
      );
      
      // 写回配置文件
      fs.writeFileSync(configPath, configContent, 'utf8');
      
      // 更新当前运行时配置
      config.security.adminPassword = newPassword;

      logger.info('密码重置成功', { ip: req.ip });

      res.json({
        success: true,
        message: '密码重置成功，请使用新密码重新登录'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
const rateLimit = require('express-rate-limit');
const config = require('../config/app');

/**
 * API 限流中间件
 * 用于保护管理接口
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 根据 IP 地址限流
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // 跳过成功的请求（可选）
  skipSuccessfulRequests: false,
  // 跳过失败的请求（可选）
  skipFailedRequests: false
});

/**
 * 重定向限流中间件
 * 用于保护短链重定向接口，防止恶意刷访问量
 */
const redirectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: config.rateLimit.redirectMax,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '访问过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // 只对成功的重定向计数
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

/**
 * 登录限流中间件
 * 防止暴力破解
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '登录尝试次数过多，请15分钟后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  skipSuccessfulRequests: true, // 成功登录不计数
  skipFailedRequests: false
});

/**
 * 二维码生成限流
 * 防止滥用
 */
const qrcodeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 最多20次
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '二维码生成请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

module.exports = {
  apiLimiter,
  redirectLimiter,
  loginLimiter,
  qrcodeLimiter
};
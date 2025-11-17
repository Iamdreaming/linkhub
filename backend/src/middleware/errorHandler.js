const logger = require('../utils/logger');

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error('请求错误:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // 默认错误响应
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误'
    }
  };

  // 根据错误类型设置响应
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse.error.code = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse.error.code = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorResponse.error.code = 'NOT_FOUND';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    errorResponse.error.code = 'CONFLICT';
  }

  // 开发环境下返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在'
    }
  });
}

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};
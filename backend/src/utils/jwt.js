const jwt = require('jsonwebtoken');
const config = require('../config/app');

/**
 * 生成 JWT Token
 */
function generateToken(payload) {
  return jwt.sign(
    payload,
    config.security.jwtSecret,
    { expiresIn: config.security.sessionTimeout }
  );
}

/**
 * 验证 JWT Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.security.jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * 解码 Token（不验证）
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
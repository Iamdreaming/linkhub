const QRCode = require('qrcode');
const config = require('../config/app');
const { ValidationError } = require('../middleware/errorHandler');
const { validateQRSize } = require('../utils/validator');

class QRService {
  /**
   * 生成二维码
   */
  static async generateQRCode(url, options = {}) {
    const {
      size = config.qrcode.defaultSize,
      format = 'png',
      margin = 2,
      color = '#000000',
      bgcolor = '#FFFFFF'
    } = options;

    // 验证尺寸
    const sizeValidation = validateQRSize(size, config);
    if (!sizeValidation.valid) {
      throw new ValidationError(sizeValidation.message);
    }

    // 验证格式
    if (!['png', 'svg'].includes(format.toLowerCase())) {
      throw new ValidationError('无效的图片格式，仅支持 png 和 svg');
    }

    // 验证边距
    const marginNum = parseInt(margin);
    if (isNaN(marginNum) || marginNum < 0 || marginNum > 10) {
      throw new ValidationError('边距必须在0-10之间');
    }

    // 二维码选项
    const qrOptions = {
      width: sizeValidation.size,
      margin: marginNum,
      color: {
        dark: color,
        light: bgcolor
      },
      errorCorrectionLevel: 'M'
    };

    try {
      if (format.toLowerCase() === 'svg') {
        // 生成 SVG 格式
        return await QRCode.toString(url, {
          ...qrOptions,
          type: 'svg'
        });
      } else {
        // 生成 PNG 格式（Buffer）
        return await QRCode.toBuffer(url, qrOptions);
      }
    } catch (error) {
      throw new Error(`二维码生成失败: ${error.message}`);
    }
  }

  /**
   * 批量生成二维码
   */
  static async generateBatchQRCodes(links, options = {}) {
    const results = [];
    const errors = [];

    for (const link of links) {
      try {
        const url = `${config.app.baseUrl}/r/${link.shortCode}`;
        const qrCode = await this.generateQRCode(url, options);
        
        results.push({
          linkId: link.id,
          shortCode: link.shortCode,
          name: link.name,
          qrCode,
          success: true
        });
      } catch (error) {
        errors.push({
          linkId: link.id,
          shortCode: link.shortCode,
          error: error.message,
          success: false
        });
      }
    }

    return {
      results,
      errors,
      total: links.length,
      success: results.length,
      failed: errors.length
    };
  }

  /**
   * 获取二维码数据URL（用于前端直接显示）
   */
  static async generateQRCodeDataURL(url, options = {}) {
    const {
      size = config.qrcode.defaultSize,
      margin = 2,
      color = '#000000',
      bgcolor = '#FFFFFF'
    } = options;

    // 验证尺寸
    const sizeValidation = validateQRSize(size, config);
    if (!sizeValidation.valid) {
      throw new ValidationError(sizeValidation.message);
    }

    const qrOptions = {
      width: sizeValidation.size,
      margin: parseInt(margin),
      color: {
        dark: color,
        light: bgcolor
      },
      errorCorrectionLevel: 'M'
    };

    try {
      return await QRCode.toDataURL(url, qrOptions);
    } catch (error) {
      throw new Error(`二维码生成失败: ${error.message}`);
    }
  }

  /**
   * 验证二维码参数
   */
  static validateQRCodeOptions(options) {
    const errors = [];

    if (options.size !== undefined) {
      const sizeValidation = validateQRSize(options.size, config);
      if (!sizeValidation.valid) {
        errors.push(sizeValidation.message);
      }
    }

    if (options.format !== undefined) {
      if (!['png', 'svg'].includes(options.format.toLowerCase())) {
        errors.push('无效的图片格式');
      }
    }

    if (options.margin !== undefined) {
      const marginNum = parseInt(options.margin);
      if (isNaN(marginNum) || marginNum < 0 || marginNum > 10) {
        errors.push('边距必须在0-10之间');
      }
    }

    if (options.color !== undefined) {
      if (!/^#[0-9A-F]{6}$/i.test(options.color)) {
        errors.push('无效的颜色格式');
      }
    }

    if (options.bgcolor !== undefined) {
      if (!/^#[0-9A-F]{6}$/i.test(options.bgcolor)) {
        errors.push('无效的背景颜色格式');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = QRService;
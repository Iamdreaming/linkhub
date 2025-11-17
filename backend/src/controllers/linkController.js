const LinkService = require('../services/linkService');
const QRService = require('../services/qrService');
const config = require('../config/app');
const logger = require('../utils/logger');

class LinkController {
  /**
   * 获取链接列表
   */
  static async getLinks(req, res, next) {
    try {
      const result = await LinkService.getLinks(req.query);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取单个链接
   */
  static async getLink(req, res, next) {
    try {
      const { id } = req.params;
      const link = await LinkService.getLinkById(id);

      res.json({
        success: true,
        data: link
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建链接
   */
  static async createLink(req, res, next) {
    try {
      const link = await LinkService.createLink(req.body);

      logger.info('创建链接', { linkId: link.id, shortCode: link.shortCode });

      res.status(201).json({
        success: true,
        data: link,
        message: '链接创建成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新链接
   */
  static async updateLink(req, res, next) {
    try {
      const { id } = req.params;
      const link = await LinkService.updateLink(id, req.body);

      logger.info('更新链接', { linkId: id });

      res.json({
        success: true,
        data: link,
        message: '链接更新成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除链接
   */
  static async deleteLink(req, res, next) {
    try {
      const { id } = req.params;
      await LinkService.deleteLink(id);

      logger.info('删除链接', { linkId: id });

      res.json({
        success: true,
        message: '链接删除成功'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量操作
   */
  static async batchOperation(req, res, next) {
    try {
      const { action, ids } = req.body;
      const result = await LinkService.batchOperation(action, ids);

      logger.info('批量操作', { action, count: result.affected });

      res.json({
        success: true,
        data: result,
        message: '批量操作完成'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查短链可用性
   */
  static async checkAvailability(req, res, next) {
    try {
      const { shortCode } = req.params;
      const result = await LinkService.checkShortCodeAvailability(shortCode);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取二维码
   */
  static async getQRCode(req, res, next) {
    try {
      const { id } = req.params;
      const link = await LinkService.getLinkById(id);

      // 生成完整URL - 优先使用请求中的baseUrl参数，否则使用配置的baseUrl，最后使用请求的origin
      let baseUrl = req.query.baseUrl || config.app.baseUrl;
      
      // 如果没有配置baseUrl，使用请求的origin
      if (!baseUrl || baseUrl === 'http://localhost:3000') {
        const protocol = req.protocol;
        const host = req.get('host');
        baseUrl = `${protocol}://${host}`;
      }
      
      const fullUrl = `${baseUrl}/r/${link.shortCode}`;

      // 生成二维码
      const format = req.query.format || 'png';
      const qrCode = await QRService.generateQRCode(fullUrl, {
        ...req.query,
        format
      });

      // 设置响应头
      if (format === 'svg') {
        res.type('image/svg+xml');
        res.send(qrCode);
      } else {
        res.type('image/png');
        res.send(qrCode);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量下载二维码
   */
  static async batchDownloadQRCodes(req, res, next) {
    try {
      const { ids, ...options } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请提供要下载的链接ID列表'
          }
        });
      }

      // 获取链接
      const links = [];
      for (const id of ids) {
        try {
          const link = await LinkService.getLinkById(id);
          links.push(link);
        } catch (error) {
          logger.warn('获取链接失败', { linkId: id, error: error.message });
        }
      }

      // 生成二维码
      const result = await QRService.generateBatchQRCodes(links, options);

      // 创建ZIP文件
      const archiver = require('archiver');
      const archive = archiver('zip', { zlib: { level: 9 } });

      res.attachment('qrcodes.zip');
      archive.pipe(res);

      // 添加二维码到ZIP
      result.results.forEach(item => {
        const filename = `${item.shortCode}-${item.name}.png`;
        archive.append(item.qrCode, { name: filename });
      });

      await archive.finalize();

      logger.info('批量下载二维码', { count: result.success });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LinkController;
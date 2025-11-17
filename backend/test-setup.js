/**
 * 测试脚本 - 验证后端核心功能
 * 运行方式: node test-setup.js
 */

require('dotenv').config();

const db = require('./src/config/database');
const Link = require('./src/models/Link');
const AccessLog = require('./src/models/AccessLog');
const LinkService = require('./src/services/linkService');
const QRService = require('./src/services/qrService');
const StatsService = require('./src/services/statsService');
const config = require('./src/config/app');

console.log('='.repeat(60));
console.log('LinkHub 后端核心功能测试');
console.log('='.repeat(60));

async function testDatabase() {
  console.log('\n[1] 测试数据库连接...');
  try {
    // 测试数据库查询
    const result = db.prepare('SELECT 1 as test').get();
    console.log('✅ 数据库连接成功:', result);
    
    // 检查表是否存在
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('links', 'access_logs')
    `).all();
    console.log('✅ 数据表:', tables.map(t => t.name).join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
    return false;
  }
}

async function testLinkModel() {
  console.log('\n[2] 测试 Link 模型...');
  try {
    // 清理测试数据
    db.prepare("DELETE FROM links WHERE short_code LIKE 'test%'").run();
    
    // 测试创建链接
    const link = Link.create({
      shortCode: 'test001',
      name: '测试链接',
      targetUrl: 'https://example.com',
      description: '这是一个测试链接',
      isActive: true
    });
    console.log('✅ 创建链接成功:', link);
    
    // 测试查询链接
    const foundLink = Link.findById(link.id);
    console.log('✅ 查询链接成功:', foundLink.name);
    
    // 测试更新链接
    const updated = Link.update(link.id, { name: '更新后的测试链接' });
    console.log('✅ 更新链接成功:', updated.name);
    
    // 测试查询列表
    const { links, pagination } = Link.findAll({ page: 1, limit: 10 });
    console.log('✅ 查询列表成功:', `共 ${pagination.total} 条记录`);
    
    return link.id;
  } catch (error) {
    console.error('❌ Link 模型测试失败:', error.message);
    return null;
  }
}

async function testAccessLogModel(linkId) {
  console.log('\n[3] 测试 AccessLog 模型...');
  try {
    // 创建访问日志
    const logId = AccessLog.create({
      linkId,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      referer: 'https://test.com'
    });
    console.log('✅ 创建访问日志成功:', logId);
    
    // 查询访问日志
    const logs = AccessLog.findByLinkId(linkId, { limit: 10 });
    console.log('✅ 查询访问日志成功:', `共 ${logs.length} 条记录`);
    
    // 获取统计数据
    const stats = AccessLog.getStats(linkId, '7d');
    console.log('✅ 获取统计数据成功:', `总访问量 ${stats.total}`);
    
    return true;
  } catch (error) {
    console.error('❌ AccessLog 模型测试失败:', error.message);
    return false;
  }
}

async function testLinkService() {
  console.log('\n[4] 测试 LinkService...');
  try {
    // 测试创建链接
    const link = await LinkService.createLink({
      shortCode: 'test002',
      name: '服务层测试链接',
      targetUrl: 'https://example.com/test',
      description: '通过服务层创建'
    });
    console.log('✅ 服务层创建链接成功:', link.name);
    
    // 测试获取链接
    const foundLink = await LinkService.getLinkById(link.id);
    console.log('✅ 服务层查询链接成功:', foundLink.name);
    
    // 测试更新链接
    const updated = await LinkService.updateLink(link.id, {
      name: '服务层更新后的链接'
    });
    console.log('✅ 服务层更新链接成功:', updated.name);
    
    // 测试检查短链可用性
    const availability = await LinkService.checkShortCodeAvailability('test999');
    console.log('✅ 检查短链可用性:', availability.available ? '可用' : '不可用');
    
    return link.id;
  } catch (error) {
    console.error('❌ LinkService 测试失败:', error.message);
    return null;
  }
}

async function testQRService() {
  console.log('\n[5] 测试 QRService...');
  try {
    const testUrl = 'https://example.com/test';
    
    // 测试生成 PNG 二维码
    const pngQR = await QRService.generateQRCode(testUrl, {
      size: 300,
      format: 'png'
    });
    console.log('✅ 生成 PNG 二维码成功:', `大小 ${pngQR.length} 字节`);
    
    // 测试生成 SVG 二维码
    const svgQR = await QRService.generateQRCode(testUrl, {
      size: 300,
      format: 'svg'
    });
    console.log('✅ 生成 SVG 二维码成功:', `长度 ${svgQR.length} 字符`);
    
    // 测试生成 Data URL
    const dataURL = await QRService.generateQRCodeDataURL(testUrl);
    console.log('✅ 生成 Data URL 成功:', dataURL.substring(0, 50) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ QRService 测试失败:', error.message);
    return false;
  }
}

async function testStatsService(linkId) {
  console.log('\n[6] 测试 StatsService...');
  try {
    // 模拟请求对象
    const mockReq = {
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: (header) => {
        if (header === 'user-agent') return 'Test Agent';
        if (header === 'referer') return 'https://test.com';
        return null;
      }
    };
    
    // 记录访问
    const logId = await StatsService.logAccess(linkId, mockReq);
    console.log('✅ 记录访问日志成功:', logId);
    
    // 获取链接统计
    const stats = await StatsService.getLinkStats(linkId, '7d');
    console.log('✅ 获取链接统计成功:', `总访问量 ${stats.summary.totalAccess}`);
    
    // 获取总体统计
    const overview = await StatsService.getOverviewStats();
    console.log('✅ 获取总体统计成功:', `总链接数 ${overview.totalLinks}`);
    
    return true;
  } catch (error) {
    console.error('❌ StatsService 测试失败:', error.message);
    return false;
  }
}

async function testConfig() {
  console.log('\n[7] 测试配置...');
  try {
    console.log('✅ 应用配置:');
    console.log('   - 环境:', config.app.env);
    console.log('   - 端口:', config.app.port);
    console.log('   - 基础URL:', config.app.baseUrl);
    console.log('✅ 安全配置:');
    console.log('   - JWT密钥长度:', config.security.jwtSecret.length);
    console.log('   - Session超时:', config.security.sessionTimeout, '秒');
    console.log('✅ 备份配置:');
    console.log('   - 启用:', config.backup.enabled);
    console.log('   - 计划:', config.backup.schedule);
    console.log('   - 保留天数:', config.backup.retentionDays);
    
    return true;
  } catch (error) {
    console.error('❌ 配置测试失败:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n开始测试...\n');
  
  const results = {
    database: await testDatabase(),
    config: await testConfig(),
    linkModel: null,
    accessLogModel: false,
    linkService: null,
    qrService: await testQRService(),
    statsService: false
  };
  
  // 测试 Link 模型
  const linkId = await testLinkModel();
  results.linkModel = linkId !== null;
  
  // 测试 AccessLog 模型
  if (linkId) {
    results.accessLogModel = await testAccessLogModel(linkId);
  }
  
  // 测试 LinkService
  const serviceLinkId = await testLinkService();
  results.linkService = serviceLinkId !== null;
  
  // 测试 StatsService
  if (serviceLinkId) {
    results.statsService = await testStatsService(serviceLinkId);
  }
  
  // 输出测试结果
  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result ? '✅ 通过' : '❌ 失败';
    console.log(`${status} - ${name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`测试完成: ${passed}/${total} 通过`);
  console.log('='.repeat(60));
  
  // 清理测试数据
  console.log('\n清理测试数据...');
  db.prepare("DELETE FROM links WHERE short_code LIKE 'test%'").run();
  console.log('✅ 测试数据已清理');
  
  process.exit(passed === total ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
  console.error('\n❌ 测试过程发生错误:', error);
  process.exit(1);
});
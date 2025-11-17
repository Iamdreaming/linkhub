/**
 * API 测试脚本
 * 测试所有后端 API 接口
 * 运行方式: node test-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

let authToken = '';
let testLinkId = null;

console.log('='.repeat(60));
console.log('LinkHub API 测试');
console.log('='.repeat(60));

// 辅助函数
function logTest(name, success, data = null) {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (data) {
    console.log('   响应:', JSON.stringify(data, null, 2).split('\n').slice(0, 5).join('\n   '));
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试函数
async function testHealthCheck() {
  console.log('\n[1] 测试健康检查...');
  try {
    const response = await axios.get(`${API_URL}/health`);
    logTest('健康检查', response.data.success, response.data);
    return true;
  } catch (error) {
    logTest('健康检查', false, error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n[2] 测试登录...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      password: 'admin123456'
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      logTest('登录成功', true, { token: authToken.substring(0, 20) + '...' });
      return true;
    }
    return false;
  } catch (error) {
    logTest('登录失败', false, error.response?.data || error.message);
    return false;
  }
}

async function testVerifyToken() {
  console.log('\n[3] 测试 Token 验证...');
  try {
    const response = await axios.get(`${API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('Token 验证', response.data.success, response.data);
    return true;
  } catch (error) {
    logTest('Token 验证', false, error.response?.data || error.message);
    return false;
  }
}

async function testCreateLink() {
  console.log('\n[4] 测试创建链接...');
  try {
    const response = await axios.post(`${API_URL}/links`, {
      shortCode: 'test_api_001',
      name: 'API测试链接',
      targetUrl: 'https://example.com/test',
      description: '这是通过API测试创建的链接'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      testLinkId = response.data.data.id;
      logTest('创建链接', true, response.data.data);
      return true;
    }
    return false;
  } catch (error) {
    logTest('创建链接', false, error.response?.data || error.message);
    return false;
  }
}

async function testGetLinks() {
  console.log('\n[5] 测试获取链接列表...');
  try {
    const response = await axios.get(`${API_URL}/links`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });
    logTest('获取链接列表', response.data.success, {
      total: response.data.data.pagination.total,
      count: response.data.data.links.length
    });
    return true;
  } catch (error) {
    logTest('获取链接列表', false, error.response?.data || error.message);
    return false;
  }
}

async function testGetLink() {
  console.log('\n[6] 测试获取单个链接...');
  try {
    const response = await axios.get(`${API_URL}/links/${testLinkId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('获取单个链接', response.data.success, response.data.data);
    return true;
  } catch (error) {
    logTest('获取单个链接', false, error.response?.data || error.message);
    return false;
  }
}

async function testUpdateLink() {
  console.log('\n[7] 测试更新链接...');
  try {
    const response = await axios.put(`${API_URL}/links/${testLinkId}`, {
      name: 'API测试链接（已更新）',
      description: '更新后的描述'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('更新链接', response.data.success, response.data.data);
    return true;
  } catch (error) {
    logTest('更新链接', false, error.response?.data || error.message);
    return false;
  }
}

async function testGetQRCode() {
  console.log('\n[8] 测试获取二维码...');
  try {
    const response = await axios.get(`${API_URL}/links/${testLinkId}/qrcode`, {
      params: { size: 300, format: 'png' },
      responseType: 'arraybuffer'
    });
    logTest('获取二维码', response.status === 200, {
      contentType: response.headers['content-type'],
      size: response.data.length + ' bytes'
    });
    return true;
  } catch (error) {
    logTest('获取二维码', false, error.message);
    return false;
  }
}

async function testRedirect() {
  console.log('\n[9] 测试短链重定向...');
  try {
    const response = await axios.get(`${BASE_URL}/r/test_api_001`, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    logTest('短链重定向', response.status === 302, {
      location: response.headers.location
    });
    return true;
  } catch (error) {
    if (error.response && error.response.status === 302) {
      logTest('短链重定向', true, {
        location: error.response.headers.location
      });
      return true;
    }
    logTest('短链重定向', false, error.message);
    return false;
  }
}

async function testGetStats() {
  console.log('\n[10] 测试获取统计...');
  try {
    // 等待一下让访问日志记录完成
    await sleep(1000);
    
    const response = await axios.get(`${API_URL}/links/${testLinkId}/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { period: '7d' }
    });
    logTest('获取统计', response.data.success, {
      totalAccess: response.data.data.summary.totalAccess,
      todayAccess: response.data.data.summary.todayAccess
    });
    return true;
  } catch (error) {
    logTest('获取统计', false, error.response?.data || error.message);
    return false;
  }
}

async function testGetOverviewStats() {
  console.log('\n[11] 测试获取总体统计...');
  try {
    const response = await axios.get(`${API_URL}/stats/overview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('获取总体统计', response.data.success, {
      totalLinks: response.data.data.totalLinks,
      totalAccess: response.data.data.totalAccess
    });
    return true;
  } catch (error) {
    logTest('获取总体统计', false, error.response?.data || error.message);
    return false;
  }
}

async function testCreateBackup() {
  console.log('\n[12] 测试创建备份...');
  try {
    const response = await axios.post(`${API_URL}/backup`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('创建备份', response.data.success, {
      filename: response.data.data.filename,
      size: response.data.data.size
    });
    return true;
  } catch (error) {
    logTest('创建备份', false, error.response?.data || error.message);
    return false;
  }
}

async function testGetBackupList() {
  console.log('\n[13] 测试获取备份列表...');
  try {
    const response = await axios.get(`${API_URL}/backups`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('获取备份列表', response.data.success, {
      total: response.data.data.total,
      totalSize: response.data.data.totalSize
    });
    return true;
  } catch (error) {
    logTest('获取备份列表', false, error.response?.data || error.message);
    return false;
  }
}

async function testDeleteLink() {
  console.log('\n[14] 测试删除链接...');
  try {
    const response = await axios.delete(`${API_URL}/links/${testLinkId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('删除链接', response.data.success, response.data);
    return true;
  } catch (error) {
    logTest('删除链接', false, error.response?.data || error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n[15] 测试未授权访问...');
  try {
    await axios.get(`${API_URL}/links`);
    logTest('未授权访问（应该失败）', false);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logTest('未授权访问被正确拦截', true, {
        status: 401,
        message: error.response.data.error.message
      });
      return true;
    }
    logTest('未授权访问', false, error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('\n开始测试...\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    login: await testLogin()
  };
  
  if (!results.login) {
    console.log('\n❌ 登录失败，无法继续测试');
    return;
  }
  
  results.verifyToken = await testVerifyToken();
  results.createLink = await testCreateLink();
  
  if (!results.createLink) {
    console.log('\n❌ 创建链接失败，跳过相关测试');
  } else {
    results.getLinks = await testGetLinks();
    results.getLink = await testGetLink();
    results.updateLink = await testUpdateLink();
    results.getQRCode = await testGetQRCode();
    results.redirect = await testRedirect();
    results.getStats = await testGetStats();
    results.getOverviewStats = await testGetOverviewStats();
    results.createBackup = await testCreateBackup();
    results.getBackupList = await testGetBackupList();
    results.deleteLink = await testDeleteLink();
  }
  
  results.unauthorizedAccess = await testUnauthorizedAccess();
  
  // 输出测试结果
  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`测试完成: ${passed}/${total} 通过`);
  console.log('='.repeat(60));
  
  process.exit(passed === total ? 0 : 1);
}

// 运行测试
runAllTests().catch(error => {
  console.error('\n❌ 测试过程发生错误:', error);
  process.exit(1);
});
# 二维码动态URL生成说明

## 功能说明

二维码生成功能现在支持动态URL，会根据用户当前访问的网站地址自动生成对应的短链接二维码。

## 工作原理

### 1. 前端获取当前网站地址

```javascript
// frontend/src/views/links/index.vue
const baseUrl = window.location.origin  // 例如: https://your-domain.com
```

### 2. 传递给后端API

```javascript
const blob = await api.qrcode.get(row.id, { 
  size: 300,
  baseUrl: baseUrl  // 传递当前网站地址
})
```

### 3. 后端动态生成URL

```javascript
// backend/src/controllers/linkController.js
let baseUrl = req.query.baseUrl || config.app.baseUrl;

// 如果没有配置baseUrl，使用请求的origin
if (!baseUrl || baseUrl === 'http://localhost:3000') {
  const protocol = req.protocol;
  const host = req.get('host');
  baseUrl = `${protocol}://${host}`;
}

const fullUrl = `${baseUrl}/r/${link.shortCode}`;
```

## 使用场景

### 场景1：开发环境
- 访问地址：`http://localhost:5173`
- 生成的二维码URL：`http://localhost:5173/r/wx001`

### 场景2：测试环境
- 访问地址：`http://test.example.com`
- 生成的二维码URL：`http://test.example.com/r/wx001`

### 场景3：生产环境
- 访问地址：`https://linkhub.example.com`
- 生成的二维码URL：`https://linkhub.example.com/r/wx001`

## 优势

1. **灵活性**：无需修改配置文件，自动适应不同环境
2. **多域名支持**：同一个后端可以服务多个前端域名
3. **开发便利**：开发、测试、生产环境无缝切换

## 配置优先级

1. **前端传递的 baseUrl** (最高优先级)
2. **后端配置的 BASE_URL** (环境变量)
3. **请求的 origin** (自动检测)

## 注意事项

1. 确保前端和后端在同一个域名下，或者配置了正确的CORS
2. 生产环境建议在 `.env` 中配置 `BASE_URL` 作为备用
3. 如果使用反向代理（如Nginx），确保正确传递了 `Host` 头

## 示例配置

### 开发环境 (.env.development)
```bash
# 前端会自动使用 window.location.origin
VITE_API_BASE_URL=http://localhost:3000/api
```

### 生产环境 (.env.production)
```bash
# 前端会自动使用 window.location.origin
VITE_API_BASE_URL=/api
```

### 后端环境变量 (backend/.env)
```bash
# 作为备用，当前端未传递时使用
BASE_URL=https://your-domain.com
```

## 测试方法

1. 启动后端服务
2. 启动前端服务
3. 登录系统
4. 进入链接管理页面
5. 点击任意链接的"二维码"按钮
6. 查看生成的二维码，扫描验证URL是否正确

## 故障排查

### 问题1：二维码URL不正确
- 检查前端是否正确传递了 `baseUrl` 参数
- 检查后端日志，确认接收到的参数

### 问题2：跨域问题
- 确保后端配置了正确的CORS策略
- 检查 `backend/src/app.js` 中的CORS配置

### 问题3：反向代理问题
- 确保Nginx正确传递了 `Host` 和 `X-Forwarded-Proto` 头
- 检查后端是否正确识别了协议（http/https）
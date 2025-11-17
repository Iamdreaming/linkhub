# LinkHub 架构设计文档

## 项目概述

LinkHub 是一个轻量级的微信链接转换工具，支持将动态的微信链接固定为短链接，并生成二维码供用户扫描访问。

### 核心特性

- ✅ 链接管理：创建、编辑、删除固定短链
- ✅ 二维码生成：自动生成可下载的二维码
- ✅ 访问统计：记录扫码次数和访问时间
- ✅ 自动备份：定时备份数据库
- ✅ 简单认证：密码保护管理界面
- ✅ 响应式设计：支持移动端访问

## 技术栈选型

### 后端技术栈

```
Node.js 18+              # 运行环境
Express 4.x              # Web框架
better-sqlite3 9.x       # 数据库（轻量、高性能）
qrcode 1.5.x            # 二维码生成
jsonwebtoken 9.x        # JWT认证
express-rate-limit 7.x  # API限流
helmet 7.x              # 安全防护
cors 2.x                # 跨域支持
```

**选型理由**：
- SQLite：无需额外数据库服务，适合个人部署
- better-sqlite3：同步API，性能优于异步版本
- Express：成熟稳定，生态丰富

### 前端技术栈

```
Vue 3.4+                # 前端框架
Vite 5.x                # 构建工具
Element Plus 2.x        # UI组件库
Pinia 2.x               # 状态管理
Vue Router 4.x          # 路由管理
Axios 1.x               # HTTP客户端
```

**选型理由**：
- Vue 3：轻量、易学、性能好
- Vite：开发体验好，构建速度快
- Element Plus：组件丰富，中文文档完善

## 项目结构

```
linkhub/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   │   ├── database.js # 数据库配置
│   │   │   └── app.js      # 应用配置
│   │   ├── models/         # 数据模型
│   │   │   ├── Link.js     # 链接模型
│   │   │   └── AccessLog.js # 访问日志模型
│   │   ├── routes/         # 路由定义
│   │   │   ├── api.js      # API路由
│   │   │   └── redirect.js # 重定向路由
│   │   ├── controllers/    # 控制器
│   │   │   ├── linkController.js
│   │   │   └── authController.js
│   │   ├── middleware/     # 中间件
│   │   │   ├── auth.js     # 认证中间件
│   │   │   └── rateLimit.js # 限流中间件
│   │   ├── services/       # 业务逻辑
│   │   │   ├── linkService.js
│   │   │   ├── qrService.js
│   │   │   └── backupService.js
│   │   ├── utils/          # 工具函数
│   │   │   ├── logger.js   # 日志工具
│   │   │   └── validator.js # 验证工具
│   │   └── app.js          # 应用入口
│   ├── data/               # 数据目录
│   │   ├── linkhub.db      # SQLite数据库
│   │   └── backups/        # 备份目录
│   ├── public/             # 静态文件（前端构建产物）
│   ├── package.json
│   └── .env.example        # 环境变量示例
│
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── api/           # API接口
│   │   │   └── index.js
│   │   ├── components/    # 组件
│   │   │   ├── LinkList.vue
│   │   │   ├── LinkForm.vue
│   │   │   ├── QRCodeModal.vue
│   │   │   └── StatsChart.vue
│   │   ├── views/         # 页面
│   │   │   ├── Login.vue
│   │   │   ├── Dashboard.vue
│   │   │   └── NotFound.vue
│   │   ├── router/        # 路由配置
│   │   │   └── index.js
│   │   ├── stores/        # 状态管理
│   │   │   └── auth.js
│   │   ├── utils/         # 工具函数
│   │   │   └── request.js
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
│
├── docker/                 # Docker配置
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/               # 脚本文件
│   ├── backup.sh         # 备份脚本
│   └── deploy.sh         # 部署脚本
├── docs/                  # 文档
│   ├── architecture.md   # 架构文档（本文件）
│   ├── api.md           # API文档
│   └── deployment.md    # 部署文档
├── .gitignore
├── README.md
└── package.json          # 根package.json（工作区配置）
```

## 数据库设计

### Links 表（链接表）

```sql
CREATE TABLE links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code VARCHAR(20) UNIQUE NOT NULL,    -- 短链代码（如：wx001）
  name VARCHAR(100) NOT NULL,                 -- 链接名称
  target_url TEXT NOT NULL,                   -- 目标微信链接
  description TEXT,                           -- 描述信息
  is_active BOOLEAN DEFAULT 1,                -- 是否启用
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_short_code ON links(short_code);
CREATE INDEX idx_is_active ON links(is_active);
```

### AccessLogs 表（访问日志表）

```sql
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER NOT NULL,                   -- 关联链接ID
  access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),                     -- 访问IP
  user_agent TEXT,                            -- 用户代理
  referer TEXT,                               -- 来源页面
  FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

CREATE INDEX idx_link_id ON access_logs(link_id);
CREATE INDEX idx_access_time ON access_logs(access_time);
```

## API 设计

### 认证相关

#### POST /api/auth/login
登录获取Token

**请求体**：
```json
{
  "password": "your_password"
}
```

**响应**：
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### 链接管理

#### GET /api/links
获取所有链接列表

**查询参数**：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `search`: 搜索关键词

**响应**：
```json
{
  "success": true,
  "data": {
    "links": [
      {
        "id": 1,
        "shortCode": "wx001",
        "name": "客服微信",
        "targetUrl": "weixin://...",
        "description": "主要客服账号",
        "isActive": true,
        "accessCount": 156,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

#### POST /api/links
创建新链接

**请求体**：
```json
{
  "shortCode": "wx001",
  "name": "客服微信",
  "targetUrl": "weixin://...",
  "description": "主要客服账号"
}
```

#### PUT /api/links/:id
更新链接信息

**请求体**：
```json
{
  "name": "新名称",
  "targetUrl": "weixin://...",
  "description": "更新描述",
  "isActive": true
}
```

#### DELETE /api/links/:id
删除链接

#### GET /api/links/:id/stats
获取链接统计信息

**响应**：
```json
{
  "success": true,
  "data": {
    "totalAccess": 156,
    "todayAccess": 12,
    "weekAccess": 89,
    "monthAccess": 156,
    "recentLogs": [
      {
        "accessTime": "2024-01-01T12:00:00Z",
        "ipAddress": "192.168.1.1"
      }
    ],
    "dailyStats": [
      { "date": "2024-01-01", "count": 12 },
      { "date": "2024-01-02", "count": 15 }
    ]
  }
}
```

### 二维码相关

#### GET /api/links/:id/qrcode
获取二维码图片

**查询参数**：
- `size`: 尺寸（默认300）
- `format`: 格式（png/svg，默认png）

**响应**：图片二进制数据

### 重定向

#### GET /r/:shortCode
短链重定向到目标链接

## 核心功能实现

### 1. 短链生成策略

```javascript
// 生成短链代码的策略
function generateShortCode(name) {
  // 策略1：使用拼音首字母 + 数字
  const pinyin = getPinyin(name); // 如：客服 -> kefu
  const prefix = pinyin.substring(0, 4);
  const suffix = Date.now().toString(36).slice(-4);
  return `${prefix}${suffix}`;
  
  // 策略2：用户自定义（推荐）
  // 用户可以自己指定如：wx001, service01 等
}
```

### 2. 二维码生成

```javascript
// 使用qrcode库生成二维码
const QRCode = require('qrcode');

async function generateQRCode(url, options = {}) {
  const defaultOptions = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  return await QRCode.toBuffer(url, qrOptions);
}
```

### 3. 访问统计

```javascript
// 记录访问日志
async function logAccess(linkId, req) {
  const log = {
    linkId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer') || null,
    accessTime: new Date()
  };
  
  await AccessLog.create(log);
}

// 统计分析
async function getStats(linkId, period = '7d') {
  const startDate = getStartDate(period);
  
  return {
    total: await AccessLog.count({ linkId }),
    period: await AccessLog.count({ 
      linkId, 
      accessTime: { $gte: startDate } 
    }),
    daily: await AccessLog.groupByDay(linkId, startDate)
  };
}
```

### 4. 自动备份

```javascript
// 定时备份数据库
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// 每天凌晨3点备份
cron.schedule('0 3 * * *', async () => {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(__dirname, '../data/backups', `backup-${timestamp}.db`);
  
  // 复制数据库文件
  fs.copyFileSync(
    path.join(__dirname, '../data/linkhub.db'),
    backupPath
  );
  
  // 保留最近30天的备份
  cleanOldBackups(30);
  
  console.log(`数据库备份完成: ${backupPath}`);
});
```

### 5. 安全机制

```javascript
// JWT认证中间件
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token无效' });
  }
}

// API限流
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁，请稍后再试'
});

// 重定向限流（防止恶意刷访问量）
const redirectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 同一IP最多10次
  skipSuccessfulRequests: true
});
```

## 部署方案

### 方案一：Docker部署（推荐）

```yaml
# docker-compose.yml
version: '3.8'

services:
  linkhub:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    restart: unless-stopped
```

**部署步骤**：
```bash
# 1. 克隆项目
git clone <repository-url>
cd linkhub

# 2. 配置环境变量
cp .env.example .env
# 编辑.env文件，设置密码和密钥

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### 方案二：PM2部署

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install && npm run build

# 2. 复制前端构建产物
cp -r frontend/dist/* backend/public/

# 3. 使用PM2启动
cd backend
pm2 start src/app.js --name linkhub

# 4. 设置开机自启
pm2 startup
pm2 save
```

### 方案三：直接运行

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## 环境变量配置

```bash
# .env 文件示例

# 应用配置
NODE_ENV=production
PORT=3000
BASE_URL=https://your-domain.com

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-change-this
ADMIN_PASSWORD=your-admin-password

# 数据库配置
DB_PATH=./data/linkhub.db

# 备份配置
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 3 * * *
BACKUP_RETENTION_DAYS=30

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 性能优化

### 1. 数据库优化

- 使用索引加速查询
- 定期清理过期日志（保留90天）
- 使用连接池管理数据库连接

### 2. 缓存策略

```javascript
// 使用内存缓存热门链接
const NodeCache = require('node-cache');
const linkCache = new NodeCache({ stdTTL: 600 }); // 10分钟过期

async function getLinkByShortCode(shortCode) {
  // 先查缓存
  let link = linkCache.get(shortCode);
  if (link) return link;
  
  // 缓存未命中，查数据库
  link = await Link.findOne({ shortCode });
  if (link) {
    linkCache.set(shortCode, link);
  }
  
  return link;
}
```

### 3. 静态资源优化

- 前端资源使用CDN
- 启用Gzip压缩
- 图片懒加载

## 监控与日志

### 日志级别

```javascript
// 使用winston记录日志
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 监控指标

- API响应时间
- 数据库查询性能
- 错误率统计
- 访问量趋势

## 扩展性考虑

### 未来可扩展功能

1. **多用户支持**：添加用户系统，支持多人协作
2. **自定义域名**：支持用户绑定自己的短链域名
3. **批量导入**：Excel批量导入链接
4. **API开放**：提供开放API供第三方调用
5. **数据分析**：更详细的访问分析和报表
6. **微信通知**：访问量达到阈值时微信通知

### 技术债务管理

- 定期更新依赖包
- 代码质量检查（ESLint）
- 单元测试覆盖率 > 80%
- 性能测试和压力测试

## 安全检查清单

- [x] 密码加密存储
- [x] JWT Token认证
- [x] API限流保护
- [x] XSS防护
- [x] SQL注入防护（使用参数化查询）
- [x] CORS配置
- [x] HTTPS部署
- [x] 定期备份
- [x] 日志审计

## 总结

本架构设计基于以下原则：

1. **简单易用**：个人用户可快速部署和使用
2. **性能优先**：使用SQLite和缓存保证响应速度
3. **安全可靠**：基本的安全防护和数据备份
4. **易于维护**：清晰的代码结构和完善的文档
5. **可扩展性**：预留扩展接口，支持未来功能增加

适用场景：个人或小团队使用，日访问量在1000次以内的场景。
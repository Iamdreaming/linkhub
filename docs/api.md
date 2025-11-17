# LinkHub API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

## 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| DUPLICATE_ERROR | 409 | 资源冲突（如短链已存在） |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 认证接口

### 登录

获取访问令牌

**请求**

```http
POST /api/auth/login
Content-Type: application/json

{
  "password": "your_password"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  },
  "message": "登录成功"
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "密码错误"
  }
}
```

### 验证Token

验证当前Token是否有效

**请求**

```http
GET /api/auth/verify
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2024-01-02T00:00:00Z"
  }
}
```

---

## 链接管理接口

### 获取链接列表

获取所有链接，支持分页和搜索

**请求**

```http
GET /api/links?page=1&limit=20&search=客服&status=active
Authorization: Bearer <token>
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 20 | 每页数量（最大100） |
| search | string | 否 | - | 搜索关键词（匹配名称和描述） |
| status | string | 否 | all | 状态筛选：all/active/inactive |
| sortBy | string | 否 | createdAt | 排序字段：createdAt/name/accessCount |
| sortOrder | string | 否 | desc | 排序方向：asc/desc |

**响应**

```json
{
  "success": true,
  "data": {
    "links": [
      {
        "id": 1,
        "shortCode": "wx001",
        "name": "客服微信",
        "targetUrl": "weixin://dl/business/?t=xxx",
        "description": "主要客服账号",
        "isActive": true,
        "accessCount": 156,
        "lastAccessAt": "2024-01-01T12:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 获取单个链接

根据ID获取链接详情

**请求**

```http
GET /api/links/:id
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "shortCode": "wx001",
    "name": "客服微信",
    "targetUrl": "weixin://dl/business/?t=xxx",
    "description": "主要客服账号",
    "isActive": true,
    "accessCount": 156,
    "lastAccessAt": "2024-01-01T12:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 创建链接

创建新的短链接

**请求**

```http
POST /api/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "shortCode": "wx001",
  "name": "客服微信",
  "targetUrl": "weixin://dl/business/?t=xxx",
  "description": "主要客服账号",
  "isActive": true
}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| shortCode | string | 是 | 短链代码（3-20字符，字母数字下划线） |
| name | string | 是 | 链接名称（1-100字符） |
| targetUrl | string | 是 | 目标URL |
| description | string | 否 | 描述信息（最多500字符） |
| isActive | boolean | 否 | 是否启用（默认true） |

**响应**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "shortCode": "wx001",
    "name": "客服微信",
    "targetUrl": "weixin://dl/business/?t=xxx",
    "description": "主要客服账号",
    "isActive": true,
    "accessCount": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "链接创建成功"
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ERROR",
    "message": "短链代码已存在",
    "details": {
      "field": "shortCode",
      "value": "wx001"
    }
  }
}
```

### 更新链接

更新现有链接信息

**请求**

```http
PUT /api/links/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新的客服微信",
  "targetUrl": "weixin://dl/business/?t=yyy",
  "description": "更新后的描述",
  "isActive": true
}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 链接名称 |
| targetUrl | string | 否 | 目标URL |
| description | string | 否 | 描述信息 |
| isActive | boolean | 否 | 是否启用 |

**注意**: shortCode不可修改

**响应**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "shortCode": "wx001",
    "name": "新的客服微信",
    "targetUrl": "weixin://dl/business/?t=yyy",
    "description": "更新后的描述",
    "isActive": true,
    "accessCount": 156,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "链接更新成功"
}
```

### 删除链接

删除指定链接（软删除）

**请求**

```http
DELETE /api/links/:id
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "message": "链接删除成功"
}
```

### 批量操作

批量启用/禁用链接

**请求**

```http
POST /api/links/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "activate",
  "ids": [1, 2, 3]
}
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 操作类型：activate/deactivate/delete |
| ids | array | 是 | 链接ID数组 |

**响应**

```json
{
  "success": true,
  "data": {
    "affected": 3,
    "failed": []
  },
  "message": "批量操作完成"
}
```

---

## 统计接口

### 获取链接统计

获取指定链接的访问统计

**请求**

```http
GET /api/links/:id/stats?period=7d
Authorization: Bearer <token>
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| period | string | 否 | 7d | 统计周期：24h/7d/30d/90d/all |

**响应**

```json
{
  "success": true,
  "data": {
    "linkInfo": {
      "id": 1,
      "shortCode": "wx001",
      "name": "客服微信"
    },
    "summary": {
      "totalAccess": 156,
      "periodAccess": 89,
      "todayAccess": 12,
      "avgDailyAccess": 12.7
    },
    "dailyStats": [
      {
        "date": "2024-01-01",
        "count": 12,
        "uniqueIp": 8
      },
      {
        "date": "2024-01-02",
        "count": 15,
        "uniqueIp": 10
      }
    ],
    "hourlyStats": [
      { "hour": 0, "count": 2 },
      { "hour": 1, "count": 1 },
      // ... 24小时数据
    ],
    "topReferers": [
      { "referer": "https://example.com", "count": 45 },
      { "referer": "direct", "count": 30 }
    ],
    "recentAccess": [
      {
        "accessTime": "2024-01-01T12:00:00Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ]
  }
}
```

### 获取总体统计

获取所有链接的汇总统计

**请求**

```http
GET /api/stats/overview
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "data": {
    "totalLinks": 10,
    "activeLinks": 8,
    "totalAccess": 1560,
    "todayAccess": 120,
    "weekAccess": 890,
    "monthAccess": 1560,
    "topLinks": [
      {
        "id": 1,
        "shortCode": "wx001",
        "name": "客服微信",
        "accessCount": 156
      }
    ],
    "recentActivity": [
      {
        "linkId": 1,
        "linkName": "客服微信",
        "accessTime": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

## 二维码接口

### 获取二维码图片

生成并返回二维码图片

**请求**

```http
GET /api/links/:id/qrcode?size=300&format=png&margin=2
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| size | integer | 否 | 300 | 图片尺寸（100-1000） |
| format | string | 否 | png | 图片格式：png/svg |
| margin | integer | 否 | 2 | 边距（0-10） |
| color | string | 否 | #000000 | 前景色（十六进制） |
| bgcolor | string | 否 | #FFFFFF | 背景色（十六进制） |

**响应**

- Content-Type: image/png 或 image/svg+xml
- 二进制图片数据

### 批量下载二维码

批量生成并下载多个二维码

**请求**

```http
POST /api/qrcodes/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "size": 300,
  "format": "png"
}
```

**响应**

- Content-Type: application/zip
- ZIP压缩包，包含所有二维码图片

---

## 重定向接口

### 短链重定向

通过短链代码重定向到目标URL

**请求**

```http
GET /r/:shortCode
```

**响应**

- HTTP 302 重定向到目标URL
- 或 404 如果短链不存在
- 或 410 如果链接已禁用

**示例**

```
访问: https://your-domain.com/r/wx001
重定向到: weixin://dl/business/?t=xxx
```

---

## 备份接口

### 创建备份

手动创建数据库备份

**请求**

```http
POST /api/backup
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "data": {
    "filename": "backup-2024-01-01.db",
    "size": 1024000,
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "message": "备份创建成功"
}
```

### 获取备份列表

获取所有可用备份

**请求**

```http
GET /api/backups
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "filename": "backup-2024-01-01.db",
        "size": 1024000,
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 10,
    "totalSize": 10240000
  }
}
```

### 恢复备份

从备份文件恢复数据库

**请求**

```http
POST /api/backup/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "backup-2024-01-01.db"
}
```

**响应**

```json
{
  "success": true,
  "message": "数据库恢复成功，请重启服务"
}
```

---

## 系统接口

### 健康检查

检查服务状态

**请求**

```http
GET /api/health
```

**响应**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "version": "1.0.0",
    "database": "connected",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### 获取系统信息

获取系统配置和统计信息

**请求**

```http
GET /api/system/info
Authorization: Bearer <token>
```

**响应**

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "nodeVersion": "18.17.0",
    "platform": "linux",
    "uptime": 86400,
    "memory": {
      "total": 1073741824,
      "used": 536870912,
      "free": 536870912
    },
    "database": {
      "size": 1024000,
      "tables": 2,
      "records": 100
    }
  }
}
```

---

## 限流说明

### API限流

- **管理接口**: 15分钟内最多100次请求
- **重定向接口**: 1分钟内同一IP最多10次请求
- **二维码接口**: 1分钟内最多20次请求

### 限流响应

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后再试",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## 使用示例

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
});

// 登录
async function login(password) {
  const response = await api.post('/auth/login', { password });
  const token = response.data.data.token;
  
  // 设置默认请求头
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return token;
}

// 获取链接列表
async function getLinks(page = 1, limit = 20) {
  const response = await api.get('/links', {
    params: { page, limit }
  });
  return response.data.data;
}

// 创建链接
async function createLink(linkData) {
  const response = await api.post('/links', linkData);
  return response.data.data;
}

// 获取统计
async function getStats(linkId, period = '7d') {
  const response = await api.get(`/links/${linkId}/stats`, {
    params: { period }
  });
  return response.data.data;
}
```

### cURL

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}'

# 获取链接列表
curl -X GET http://localhost:3000/api/links \
  -H "Authorization: Bearer <token>"

# 创建链接
curl -X POST http://localhost:3000/api/links \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shortCode": "wx001",
    "name": "客服微信",
    "targetUrl": "weixin://dl/business/?t=xxx"
  }'

# 获取二维码
curl -X GET "http://localhost:3000/api/links/1/qrcode?size=300" \
  -o qrcode.png
```

---

## 版本历史

### v1.0.0 (2024-01-01)

- 初始版本发布
- 基础链接管理功能
- 二维码生成
- 访问统计
- 自动备份

---

## 技术支持

如有问题，请提交Issue或联系开发者。
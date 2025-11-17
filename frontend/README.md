# LinkHub 前端应用

基于 Vue 3 + Vite + Element Plus 的现代化管理后台，借鉴 vue-element-admin 的设计理念。

## 技术栈

- **框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 5.x
- **UI 组件库**: Element Plus 2.x
- **状态管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **HTTP 客户端**: Axios 1.x
- **图表库**: ECharts 5.x + vue-echarts

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 接口封装
│   │   └── index.js      # 统一的 API 调用
│   ├── layout/           # 布局组件
│   │   ├── index.vue     # 主布局
│   │   └── components/   # 布局子组件
│   │       ├── Sidebar.vue   # 侧边栏
│   │       ├── Navbar.vue    # 顶部导航
│   │       └── AppMain.vue   # 主内容区
│   ├── router/           # 路由配置
│   │   └── index.js      # 路由定义和守卫
│   ├── stores/           # Pinia 状态管理
│   │   └── auth.js       # 认证状态
│   ├── styles/           # 全局样式
│   │   └── index.css     # 全局 CSS
│   ├── views/            # 页面组件
│   │   ├── login/        # 登录页
│   │   ├── dashboard/    # 数据概览
│   │   ├── links/        # 链接管理
│   │   ├── stats/        # 统计分析
│   │   └── backup/       # 备份管理
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── .env.development      # 开发环境变量
├── .env.production       # 生产环境变量
├── index.html            # HTML 模板
├── vite.config.js        # Vite 配置
└── package.json          # 依赖配置
```

## 功能模块

### 1. 登录认证
- 密码登录
- JWT Token 认证
- 自动登录状态保持
- 路由守卫保护

### 2. 数据概览
- 统计卡片展示
- 访问趋势图表
- 热门链接排行
- 快捷操作入口

### 3. 链接管理
- 链接列表（分页、搜索、筛选）
- 创建/编辑链接
- 批量操作（删除、启用/禁用）
- 二维码生成和下载
- 短链代码随机生成

### 4. 统计分析
- 链接访问统计
- 访问趋势图表
- 时段分布分析
- 访问日志查看
- 数据导出（CSV）

### 5. 备份管理
- 手动创建备份
- 备份列表查看
- 备份下载
- 备份恢复
- 清理过期备份

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 环境变量

### 开发环境 (.env.development)
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### 生产环境 (.env.production)
```
VITE_API_BASE_URL=/api
```

## API 接口

所有 API 调用都通过 `src/api/index.js` 统一管理：

```javascript
import { api } from '@/api'

// 登录
await api.auth.login(password)

// 获取链接列表
await api.links.getList(params)

// 创建链接
await api.links.create(data)

// 获取统计数据
await api.stats.getOverview()
```

## 路由配置

路由采用嵌套结构，主要路由包括：

- `/login` - 登录页
- `/dashboard` - 数据概览
- `/links` - 链接管理
- `/stats` - 统计分析
- `/backup` - 备份管理

所有需要认证的路由都会经过路由守卫验证。

## 状态管理

使用 Pinia 进行状态管理，目前包含：

- `useAuthStore` - 认证状态（token、用户信息、登录/登出）

## 样式规范

- 使用 Element Plus 的设计规范
- 响应式设计，支持移动端
- 统一的颜色主题
- 平滑的过渡动画

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 注意事项

1. **开发环境代理**: Vite 配置了 `/api` 代理到后端服务器
2. **Token 存储**: Token 存储在 localStorage 中
3. **路由守卫**: 未登录用户会被重定向到登录页
4. **错误处理**: 统一的错误提示和处理机制
5. **响应式设计**: 所有页面都支持移动端访问

## 部署说明

### 方式一：与后端一起部署

```bash
# 构建前端
npm run build

# 将 dist 目录内容复制到后端 public 目录
cp -r dist/* ../backend/public/
```

### 方式二：独立部署（需要配置 Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend-server:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 常见问题

### 1. 开发时 API 请求失败
确保后端服务已启动在 http://localhost:3000

### 2. 构建后页面空白
检查 `vite.config.js` 中的 `base` 配置

### 3. 路由刷新 404
确保服务器配置了 SPA 的 fallback 到 index.html

## 许可证

MIT License
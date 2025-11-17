# LinkHub - 微信转链工具

<div align="center">

![LinkHub Logo](https://via.placeholder.com/150x150?text=LinkHub)

**一个轻量级、易部署的微信链接转换工具**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/vue-3.4+-4FC08D.svg)](https://vuejs.org/)

[功能特性](#功能特性) • [快速开始](#快速开始) • [文档](#文档) • [截图](#截图) • [技术栈](#技术栈)

</div>

---

## 📖 项目简介

LinkHub 是一个专为个人用户设计的微信链接转换工具。它可以将动态变化的微信链接固定为短链接，并生成二维码供用户扫描访问。非常适合需要在多个场景下分享固定微信链接的场景。

### 使用场景

- 📱 **客服微信**：将客服微信固定为短链，方便在各处分享
- 🎯 **推广活动**：不同推广渠道使用不同短链，便于统计效果
- 👥 **社群管理**：多个微信群使用固定入口，便于管理
- 📊 **数据分析**：统计每个链接的访问量和访问时间

## ✨ 功能特性

### 核心功能

- ✅ **链接管理**
  - 创建、编辑、删除短链接
  - 自定义短链代码（如：wx001, service01）
  - 随时更新目标微信链接，短链不变
  - 批量操作（启用/禁用/删除）

- ✅ **二维码生成**
  - 自动生成高质量二维码
  - 支持自定义尺寸（100-1000px）
  - 支持PNG和SVG格式
  - 支持批量下载

- ✅ **访问统计**
  - 实时访问量统计
  - 按日期查看访问趋势
  - 按小时分析访问高峰
  - 来源分析（Referer统计）
  - 最近访问记录

- ✅ **安全防护**
  - 密码保护管理界面
  - JWT Token认证
  - API访问限流
  - XSS防护

- ✅ **数据备份**
  - 自动定时备份
  - 手动备份功能
  - 一键恢复数据
  - 备份文件管理

### 技术特点

- 🚀 **轻量高效**：使用SQLite数据库，无需额外数据库服务
- 📦 **易于部署**：支持Docker一键部署，也支持传统部署方式
- 🎨 **现代界面**：基于Vue 3和Element Plus的响应式设计
- 🔒 **安全可靠**：完善的认证和限流机制
- 📊 **数据可视化**：直观的图表展示访问数据

## 🚀 快速开始

### 方式一：Docker部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/your-username/linkhub.git
cd linkhub

# 2. 配置环境变量
cp .env.example .env
nano .env  # 修改密码和密钥

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
# 浏览器打开: http://localhost:3000
```

### 方式二：传统部署

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 构建前端
cd frontend
npm run build
cp -r dist/* ../backend/public/

# 3. 配置环境变量
cd ../backend
cp .env.example .env
nano .env

# 4. 启动服务
npm start

# 或使用PM2
npm install -g pm2
pm2 start src/app.js --name linkhub
```

### 首次使用

1. 访问 `http://localhost:3000`
2. 使用配置的管理员密码登录
3. 创建第一个短链接
4. 生成二维码并测试

## 📚 文档

- [架构设计文档](docs/architecture.md) - 详细的技术架构说明
- [API文档](docs/api.md) - 完整的API接口文档
- [部署指南](docs/deployment.md) - 各种部署方式的详细说明
- [用户手册](docs/user-guide.md) - 功能使用说明

## 📸 截图

### 管理界面

<div align="center">
  <img src="https://via.placeholder.com/800x500?text=Dashboard" alt="管理界面" />
  <p><i>链接管理界面</i></p>
</div>

### 统计分析

<div align="center">
  <img src="https://via.placeholder.com/800x500?text=Statistics" alt="统计分析" />
  <p><i>访问统计图表</i></p>
</div>

### 二维码生成

<div align="center">
  <img src="https://via.placeholder.com/400x400?text=QR+Code" alt="二维码" />
  <p><i>自动生成的二维码</i></p>
</div>

## 🛠 技术栈

### 后端

- **运行环境**: Node.js 18+
- **Web框架**: Express 4.x
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jsonwebtoken)
- **二维码**: qrcode
- **安全**: helmet, cors, express-rate-limit

### 前端

- **框架**: Vue 3.4+
- **构建工具**: Vite 5.x
- **UI组件**: Element Plus 2.x
- **状态管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **HTTP客户端**: Axios 1.x

### 部署

- **容器化**: Docker & Docker Compose
- **进程管理**: PM2
- **反向代理**: Nginx
- **SSL证书**: Let's Encrypt

## 📋 系统要求

### 最低配置

- CPU: 1核
- 内存: 512MB
- 硬盘: 5GB
- Node.js: 18.x+

### 推荐配置

- CPU: 2核
- 内存: 1GB
- 硬盘: 10GB
- Node.js: 20.x LTS

## 🔧 配置说明

### 环境变量

```bash
# 应用配置
NODE_ENV=production
PORT=3000
BASE_URL=https://your-domain.com

# 安全配置（必须修改）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ADMIN_PASSWORD=your-strong-password

# 备份配置
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 3 * * *
BACKUP_RETENTION_DAYS=30
```

详细配置说明请参考 [部署指南](docs/deployment.md)。

## 📊 性能指标

基于个人服务器（1核2G）的测试数据：

- **响应时间**: 平均 < 50ms
- **并发能力**: 支持100+ QPS
- **数据库大小**: 10万条记录约 50MB
- **内存占用**: 约 100MB
- **适用规模**: 日访问量 < 10,000次

## 🔐 安全建议

1. ✅ 修改默认管理员密码
2. ✅ 使用强密码（至少12位，包含大小写字母、数字、特殊字符）
3. ✅ 生产环境使用HTTPS
4. ✅ 定期更新依赖包
5. ✅ 启用自动备份
6. ✅ 限制管理界面访问IP（可选）
7. ✅ 定期检查访问日志

## 🗺 路线图

### v1.0.0 (当前版本)

- [x] 基础链接管理
- [x] 二维码生成
- [x] 访问统计
- [x] 自动备份
- [x] Docker部署

### v1.1.0 (计划中)

- [ ] 批量导入链接（Excel）
- [ ] 自定义二维码样式（Logo、颜色）
- [ ] 更详细的访问分析
- [ ] 微信通知（访问量提醒）
- [ ] 链接分组管理

### v2.0.0 (未来)

- [ ] 多用户支持
- [ ] 自定义短链域名
- [ ] API开放平台
- [ ] 移动端App
- [ ] 数据导出功能

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-username/linkhub.git
cd linkhub

# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 启动开发服务器
# 终端1：后端
cd backend && npm run dev

# 终端2：前端
cd frontend && npm run dev
```

## 📝 更新日志

### v1.0.0 (2024-01-01)

- 🎉 首次发布
- ✨ 完整的链接管理功能
- ✨ 二维码生成和下载
- ✨ 访问统计和分析
- ✨ 自动备份功能
- ✨ Docker部署支持

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 👥 作者

- **LinkHub Team** - [GitHub](https://github.com/your-username)

## 🙏 致谢

感谢以下开源项目：

- [Express](https://expressjs.com/) - Web框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI组件库
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite驱动
- [qrcode](https://github.com/soldair/node-qrcode) - 二维码生成

## 📞 联系方式

- 📧 Email: your-email@example.com
- 💬 Issues: [GitHub Issues](https://github.com/your-username/linkhub/issues)
- 📖 文档: [在线文档](https://your-docs-site.com)

## ⭐ Star History

如果这个项目对您有帮助，请给我们一个 Star ⭐️

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/linkhub&type=Date)](https://star-history.com/#your-username/linkhub&Date)

---

<div align="center">
  <p>用 ❤️ 制作</p>
  <p>Copyright © 2024 LinkHub Team</p>
</div>
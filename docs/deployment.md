# LinkHub 部署指南

本文档详细说明如何在不同环境下部署 LinkHub 微信转链工具。

## 目录

- [系统要求](#系统要求)
- [部署前准备](#部署前准备)
- [部署方式](#部署方式)
  - [方式一：Docker部署（推荐）](#方式一docker部署推荐)
  - [方式二：PM2部署](#方式二pm2部署)
  - [方式三：直接运行](#方式三直接运行)
- [配置说明](#配置说明)
- [SSL证书配置](#ssl证书配置)
- [域名配置](#域名配置)
- [常见问题](#常见问题)

---

## 系统要求

### 最低配置

- **CPU**: 1核
- **内存**: 512MB
- **硬盘**: 5GB
- **操作系统**: Linux (Ubuntu 20.04+) / Windows 10+ / macOS 10.15+
- **Node.js**: 18.x 或更高版本

### 推荐配置

- **CPU**: 2核
- **内存**: 1GB
- **硬盘**: 10GB
- **操作系统**: Ubuntu 22.04 LTS
- **Node.js**: 20.x LTS

---

## 部署前准备

### 1. 安装必要软件

#### Ubuntu/Debian

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装Git
sudo apt install -y git

# 验证安装
node --version
npm --version
```

#### CentOS/RHEL

```bash
# 安装Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 安装Git
sudo yum install -y git
```

#### Windows

1. 下载并安装 [Node.js](https://nodejs.org/)
2. 下载并安装 [Git](https://git-scm.com/)

### 2. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/your-username/linkhub.git
cd linkhub

# 或者下载ZIP包并解压
wget https://github.com/your-username/linkhub/archive/main.zip
unzip main.zip
cd linkhub-main
```

---

## 部署方式

## 方式一：Docker部署（推荐）

Docker部署是最简单、最可靠的方式，适合生产环境。

### 1. 安装Docker

#### Ubuntu

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo apt install -y docker-compose

# 将当前用户加入docker组（可选）
sudo usermod -aG docker $USER
# 重新登录以生效
```

#### Windows/macOS

下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

修改以下配置：

```bash
# 应用配置
NODE_ENV=production
PORT=3000
BASE_URL=https://your-domain.com

# 安全配置（必须修改）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ADMIN_PASSWORD=your-strong-password

# 数据库配置
DB_PATH=/app/data/linkhub.db

# 备份配置
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 3 * * *
BACKUP_RETENTION_DAYS=30
```

### 3. 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

### 4. 验证部署

```bash
# 检查服务是否正常
curl http://localhost:3000/api/health

# 应该返回：
# {"success":true,"data":{"status":"healthy",...}}
```

### 5. Docker常用命令

```bash
# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 查看日志
docker-compose logs -f linkhub

# 进入容器
docker-compose exec linkhub sh

# 更新服务
git pull
docker-compose build
docker-compose up -d
```

---

## 方式二：PM2部署

PM2是Node.js应用的进程管理器，适合VPS或云服务器部署。

### 1. 安装PM2

```bash
# 全局安装PM2
npm install -g pm2

# 验证安装
pm2 --version
```

### 2. 安装项目依赖

```bash
# 安装后端依赖
cd backend
npm install --production

# 构建前端
cd ../frontend
npm install
npm run build

# 复制前端构建产物到后端
cp -r dist/* ../backend/public/
```

### 3. 配置环境变量

```bash
cd backend

# 复制环境变量模板
cp .env.example .env

# 编辑配置
nano .env
```

### 4. 创建PM2配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'linkhub',
    script: './src/app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
```

### 5. 启动服务

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs linkhub

# 监控
pm2 monit
```

### 6. 设置开机自启

```bash
# 生成启动脚本
pm2 startup

# 保存当前进程列表
pm2 save

# 测试重启
sudo reboot
# 重启后检查
pm2 list
```

### 7. PM2常用命令

```bash
# 重启应用
pm2 restart linkhub

# 停止应用
pm2 stop linkhub

# 删除应用
pm2 delete linkhub

# 查看详细信息
pm2 show linkhub

# 清空日志
pm2 flush

# 更新PM2
npm install -g pm2
pm2 update
```

---

## 方式三：直接运行

适合开发环境或快速测试。

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
nano .env
```

### 3. 开发模式运行

```bash
# 终端1：启动后端
cd backend
npm run dev

# 终端2：启动前端
cd frontend
npm run dev
```

访问 `http://localhost:5173` 查看前端界面。

### 4. 生产模式运行

```bash
# 构建前端
cd frontend
npm run build
cp -r dist/* ../backend/public/

# 启动后端
cd ../backend
npm start
```

访问 `http://localhost:3000` 查看应用。

---

## 配置说明

### 环境变量详解

```bash
# ============ 应用配置 ============
NODE_ENV=production              # 运行环境：development/production
PORT=3000                        # 服务端口
BASE_URL=https://link.example.com # 应用访问地址（用于生成短链）

# ============ 安全配置 ============
JWT_SECRET=your-secret-key       # JWT密钥（至少32字符，必须修改）
ADMIN_PASSWORD=your-password     # 管理员密码（必须修改）
SESSION_TIMEOUT=86400            # Session超时时间（秒）

# ============ 数据库配置 ============
DB_PATH=./data/linkhub.db       # 数据库文件路径
DB_BACKUP_PATH=./data/backups   # 备份目录

# ============ 备份配置 ============
BACKUP_ENABLED=true              # 是否启用自动备份
BACKUP_SCHEDULE=0 3 * * *       # 备份时间（Cron表达式）
BACKUP_RETENTION_DAYS=30        # 备份保留天数

# ============ 限流配置 ============
RATE_LIMIT_WINDOW_MS=900000     # 限流时间窗口（毫秒）
RATE_LIMIT_MAX_REQUESTS=100     # 时间窗口内最大请求数
REDIRECT_RATE_LIMIT_MAX=10      # 重定向限流（每分钟）

# ============ 日志配置 ============
LOG_LEVEL=info                   # 日志级别：error/warn/info/debug
LOG_FILE_PATH=./logs            # 日志文件路径
LOG_MAX_SIZE=10m                # 单个日志文件最大大小
LOG_MAX_FILES=7                 # 保留日志文件数量

# ============ CORS配置 ============
CORS_ORIGIN=*                    # 允许的源（生产环境建议指定域名）
CORS_CREDENTIALS=true            # 是否允许携带凭证

# ============ 二维码配置 ============
QR_DEFAULT_SIZE=300              # 默认二维码尺寸
QR_MAX_SIZE=1000                # 最大二维码尺寸
QR_MIN_SIZE=100                 # 最小二维码尺寸
```

### Cron表达式说明

备份时间配置使用Cron表达式：

```
格式: 分 时 日 月 周
示例:
0 3 * * *     # 每天凌晨3点
0 */6 * * *   # 每6小时
0 0 * * 0     # 每周日凌晨
0 2 1 * *     # 每月1号凌晨2点
```

---

## SSL证书配置

### 使用Let's Encrypt免费证书

#### 1. 安装Certbot

```bash
# Ubuntu
sudo apt install -y certbot

# CentOS
sudo yum install -y certbot
```

#### 2. 获取证书

```bash
# 停止占用80端口的服务
sudo systemctl stop nginx  # 如果使用nginx

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书位置：
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 3. 配置Nginx反向代理

创建 `/etc/nginx/sites-available/linkhub`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/linkhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 添加自动续期任务
sudo crontab -e
# 添加以下行：
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 域名配置

### 1. DNS设置

在域名服务商处添加A记录：

```
类型: A
主机记录: @ 或 link
记录值: 你的服务器IP
TTL: 600
```

### 2. 短链域名建议

- 使用短域名，如：`l.yourdomain.com`
- 或专用域名：`link.yourdomain.com`
- 避免使用过长的域名

### 3. 验证DNS解析

```bash
# Linux/macOS
nslookup your-domain.com
dig your-domain.com

# Windows
nslookup your-domain.com
```

---

## 数据备份与恢复

### 手动备份

```bash
# 备份数据库
cp backend/data/linkhub.db backend/data/backups/manual-backup-$(date +%Y%m%d).db

# 备份整个数据目录
tar -czf linkhub-backup-$(date +%Y%m%d).tar.gz backend/data/
```

### 恢复备份

```bash
# 停止服务
pm2 stop linkhub  # 或 docker-compose stop

# 恢复数据库
cp backend/data/backups/backup-20240101.db backend/data/linkhub.db

# 重启服务
pm2 start linkhub  # 或 docker-compose start
```

### 自动备份脚本

创建 `scripts/backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/path/to/linkhub/backend/data/backups"
DB_FILE="/path/to/linkhub/backend/data/linkhub.db"
RETENTION_DAYS=30

# 创建备份
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).db"
cp "$DB_FILE" "$BACKUP_FILE"

# 压缩备份
gzip "$BACKUP_FILE"

# 删除旧备份
find "$BACKUP_DIR" -name "backup-*.db.gz" -mtime +$RETENTION_DAYS -delete

echo "备份完成: $BACKUP_FILE.gz"
```

添加到crontab：

```bash
chmod +x scripts/backup.sh
crontab -e
# 添加：每天凌晨3点备份
0 3 * * * /path/to/linkhub/scripts/backup.sh >> /path/to/linkhub/logs/backup.log 2>&1
```

---

## 监控与维护

### 1. 日志查看

```bash
# Docker
docker-compose logs -f --tail=100

# PM2
pm2 logs linkhub --lines 100

# 直接查看文件
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### 2. 性能监控

```bash
# 查看资源使用
docker stats  # Docker
pm2 monit     # PM2

# 系统资源
htop
free -h
df -h
```

### 3. 数据库维护

```bash
# 进入数据库
sqlite3 backend/data/linkhub.db

# 查看表结构
.schema

# 查看数据统计
SELECT COUNT(*) FROM links;
SELECT COUNT(*) FROM access_logs;

# 清理旧日志（保留90天）
DELETE FROM access_logs WHERE access_time < datetime('now', '-90 days');

# 优化数据库
VACUUM;

# 退出
.quit
```

---

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
sudo netstat -tulpn | grep 3000

# 修改端口
# 编辑 .env 文件，修改 PORT 值
```

### 2. 权限问题

```bash
# 修改文件所有者
sudo chown -R $USER:$USER /path/to/linkhub

# 修改数据目录权限
chmod 755 backend/data
chmod 644 backend/data/linkhub.db
```

### 3. 数据库锁定

```bash
# 检查是否有其他进程占用
lsof backend/data/linkhub.db

# 重启服务
pm2 restart linkhub
```

### 4. 内存不足

```bash
# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 5. 前端无法访问后端API

检查CORS配置：

```javascript
// backend/src/app.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

### 6. 二维码无法生成

```bash
# 检查依赖
npm list qrcode

# 重新安装
cd backend
npm install qrcode --save
```

---

## 更新升级

### 1. 备份数据

```bash
# 备份数据库和配置
cp backend/data/linkhub.db backup/
cp backend/.env backup/
```

### 2. 拉取最新代码

```bash
git pull origin main
```

### 3. 更新依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
npm run build
cp -r dist/* ../backend/public/
```

### 4. 重启服务

```bash
# Docker
docker-compose down
docker-compose build
docker-compose up -d

# PM2
pm2 restart linkhub
```

---

## 安全建议

1. **修改默认密码**：首次部署后立即修改管理员密码
2. **使用HTTPS**：生产环境必须使用SSL证书
3. **定期备份**：启用自动备份并定期测试恢复
4. **更新依赖**：定期更新Node.js和npm包
5. **防火墙配置**：只开放必要端口（80, 443）
6. **日志监控**：定期检查错误日志
7. **限制访问**：使用IP白名单限制管理界面访问

---

## 技术支持

如遇到问题，请：

1. 查看日志文件
2. 检查环境变量配置
3. 参考本文档的常见问题部分
4. 提交Issue到GitHub仓库

---

**祝您部署顺利！** 🎉
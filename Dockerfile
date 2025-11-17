# 多阶段构建 Dockerfile

# 阶段1：构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm ci --only=production

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 阶段2：构建后端
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# 复制后端依赖文件
COPY backend/package*.json ./

# 安装后端依赖（包括 better-sqlite3 需要编译）
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    apk del python3 make g++

# 阶段3：最终镜像
FROM node:20-alpine

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache tini

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制后端代码和依赖
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY backend/ ./

# 复制前端构建产物到后端 public 目录
COPY --from=frontend-builder /app/frontend/dist ./public

# 创建必要的目录
RUN mkdir -p data data/backups logs && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动应用
CMD ["node", "src/app.js"]
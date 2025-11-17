# 多阶段构建 Dockerfile
# 使用 BuildKit 缓存优化构建速度
# 构建时需要设置: DOCKER_BUILDKIT=1

# 阶段1：构建前端
FROM node:20-alpine AS frontend-builder

# 配置 Alpine 镜像源（中国区加速）
RUN sed -i 's#https\?://dl-cdn.alpinelinux.org/alpine#https://mirrors.tuna.tsinghua.edu.cn/alpine#g' /etc/apk/repositories && \
    apk update

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 配置 npm 淘宝镜像源并安装所有依赖（包括构建工具）
# 使用 BuildKit 缓存挂载加速 npm 下载
RUN --mount=type=cache,target=/root/.npm \
    npm config set registry https://registry.npmmirror.com && \
    npm install

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 阶段2：构建后端
FROM node:20-alpine AS backend-builder

# 配置 Alpine 镜像源（中国区加速）
RUN sed -i 's#https\?://dl-cdn.alpinelinux.org/alpine#https://mirrors.tuna.tsinghua.edu.cn/alpine#g' /etc/apk/repositories && \
    apk update

WORKDIR /app/backend

# 复制后端依赖文件
COPY backend/package*.json ./

# 安装后端生产依赖（包括 better-sqlite3 需要编译）
# 使用 BuildKit 缓存挂载加速 npm 下载
RUN --mount=type=cache,target=/root/.npm \
    apk add --no-cache --virtual .build-deps python3 make g++ && \
    npm config set registry https://registry.npmmirror.com && \
    npm install --omit=dev && \
    apk del .build-deps

# 阶段3：最终镜像
FROM node:20-alpine

# 配置 Alpine 镜像源（中国区加速）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update

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

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 创建必要的目录（注意：卷挂载会覆盖这些目录）
RUN mkdir -p data data/backups logs && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 tini 和启动脚本作为 init 进程
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]

# 启动应用
CMD ["node", "src/app.js"]
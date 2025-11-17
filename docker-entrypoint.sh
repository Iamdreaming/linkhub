#!/bin/sh
# {{CODE-Cycle-Integration:
#   Task_ID: [#T001]
#   Timestamp: 2025-11-17T15:30:12Z
#   Phase: [D-Develop]
#   Context-Analysis: "创建 Docker 启动脚本以确保数据目录权限正确"
#   Principle_Applied: "Advanced-Debugging-Protocol, Root-Cause-Analysis"
# }}
# {{START_MODIFICATIONS}}

set -e

echo "=== LinkHub 容器启动脚本 ==="

# 确保数据目录存在
echo "检查并创建必要的目录..."
mkdir -p /app/data /app/data/backups /app/logs

# 检查目录权限并尝试修复
echo "检查目录权限..."
if [ -w /app/data ]; then
  echo "✓ /app/data 目录可写"
else
  echo "⚠ /app/data 目录不可写，尝试修复权限..."
  # 在某些情况下，如果以 root 运行此脚本，可以修复权限
  if [ "$(id -u)" = "0" ]; then
    chown -R nodejs:nodejs /app/data /app/logs
    echo "✓ 权限已修复"
  else
    echo "✗ 无法修复权限（非 root 用户）"
    echo "  请确保宿主机的 ./backend/data 目录对容器用户可写"
  fi
fi

# 显示目录信息
echo "目录信息:"
ls -la /app/data || echo "无法列出 /app/data 目录"

# 测试数据库文件创建权限
DB_PATH="${DB_PATH:-./data/linkhub.db}"
echo "数据库路径: $DB_PATH"

# 如果数据库文件不存在，尝试创建测试文件
if [ ! -f "/app/data/linkhub.db" ]; then
  echo "尝试创建测试文件..."
  if touch /app/data/.test 2>/dev/null; then
    echo "✓ 可以在 /app/data 目录创建文件"
    rm -f /app/data/.test
  else
    echo "✗ 无法在 /app/data 目录创建文件"
    echo "  错误: 权限被拒绝"
    echo "  解决方案:"
    echo "  1. 停止容器: docker-compose down"
    echo "  2. 删除数据目录: rm -rf backend/data"
    echo "  3. 重新创建: mkdir -p backend/data/backups"
    echo "  4. 重新启动: docker-compose up -d"
  fi
fi

echo "=== 启动应用 ==="
# 执行传入的命令（通常是 node src/app.js）
exec "$@"

# {{END_MODIFICATIONS}}
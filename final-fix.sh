#!/bin/bash

echo "========= 前海读书会管理系统端口问题修复工具 ========="
echo "该工具将彻底解决端口占用问题并重启应用"

# 步骤1: 停止所有Node进程
echo "[步骤1] 停止所有Node进程..."
killall -9 node 2>/dev/null || true
killall -9 nodemon 2>/dev/null || true
sleep 2

# 步骤2: 释放所有使用的端口
echo "[步骤2] 释放所有可能被占用的端口..."
for port in $(seq 3000 3010); do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
sleep 2

# 步骤3: 检查端口是否已释放
echo "[步骤3] 验证端口已释放..."
PORT_3000_FREE=true
PORT_3001_FREE=true

if lsof -ti:3000 >/dev/null 2>&1; then
  PORT_3000_FREE=false
  echo "端口3000仍被占用!"
else
  echo "端口3000已释放，可用于前端"
fi

if lsof -ti:3001 >/dev/null 2>&1; then
  PORT_3001_FREE=false
  echo "端口3001仍被占用!"
else
  echo "端口3001已释放，可用于后端"
fi

if [ "$PORT_3000_FREE" = false ] || [ "$PORT_3001_FREE" = false ]; then
  echo "警告: 某些端口仍被占用，请手动检查并终止相关进程"
  echo "可以使用命令: lsof -i :3000 和 lsof -i :3001 查看占用端口的进程"
  exit 1
fi

# 步骤4: 在新的终端窗口中启动后端
echo "[步骤4] 启动后端服务器 (端口3001)..."
osascript -e 'tell application "Terminal" to do script "cd \"'$PWD'\" && export PORT=3001 && npm run server"'
sleep 5

# 步骤5: 检查后端是否成功启动
echo "[步骤5] 验证后端服务器是否成功启动..."
if curl -s http://localhost:3001/api/leaders >/dev/null 2>&1; then
  echo "✅ 后端服务器已成功启动，API可访问"
else
  echo "❌ 后端服务器可能未成功启动，API不可访问"
  echo "请检查后端终端窗口中的错误信息"
fi

# 步骤6: 在新的终端窗口中启动前端
echo "[步骤6] 启动前端应用 (端口3000)..."
osascript -e 'tell application "Terminal" to do script "cd \"'$PWD'\" && export PORT=3000 && export BROWSER=none && npm run client"'
sleep 10

# 步骤7: 检查前端是否成功启动
echo "[步骤7] 验证前端应用是否成功启动..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "✅ 前端应用已成功启动，可通过浏览器访问"
else
  echo "❌ 前端应用可能未成功启动"
  echo "请检查前端终端窗口中的错误信息"
fi

echo "[步骤8] 打开前端应用..."
open http://localhost:3000

echo "========= 修复和启动过程完成 ========="
echo "前端地址: http://localhost:3000"
echo "后端API地址: http://localhost:3001/api/"
echo ""
echo "如果您在浏览器中仍无法访问应用，请检查终端窗口中的错误信息"
echo "或者尝试手动访问上述地址" 
#!/bin/bash

# 终极修复脚本 - 解决端口和样式问题
echo "==============================================="
echo "前海读书会管理系统 - 终极修复工具"
echo "==============================================="

# 杀死所有Node进程和占用端口的进程
echo "[步骤1] 终止所有Node进程..."
pkill -9 node
pkill -9 nodemon
sleep 2

# 清理端口
echo "[步骤2] 释放所有端口..."
for port in {3000..3010}
do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
sleep 2

# 1. 修复React样式导入
echo "[步骤3] 修复React样式导入..."
# 备份原文件
cp src/index.js src/index.js.bak

# 检查并更正样式导入
sed -i '' 's/antd\/dist\/reset.css/antd\/dist\/antd.css/g' src/index.js

echo "[步骤4] 检查前端和后端是否使用不同端口..."
# 设置环境变量
export FRONTEND_PORT=3000
export BACKEND_PORT=3001
export REACT_APP_API_URL=http://localhost:3001
export PORT=3000
export TEST_MODE=false

# 创建新的终端窗口启动后端
echo "[步骤5] 启动后端服务 (端口3001)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'\" && export PORT=3001 && npm run server"'
sleep 5

# 验证后端是否正常运行
echo "[步骤6] 验证后端服务..."
MAX_ATTEMPTS=10
ATTEMPT=1
BACKEND_READY=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "检查后端服务 (尝试 $ATTEMPT/$MAX_ATTEMPTS)..."
  if curl -s http://localhost:3001/api/leaders > /dev/null; then
    echo "✅ 后端服务器已成功启动!"
    BACKEND_READY=true
    break
  else
    echo "⏳ 等待后端启动..."
    sleep 3
  fi
  ATTEMPT=$((ATTEMPT+1))
done

# 现在启动前端
echo "[步骤7] 启动前端服务 (端口3000)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'\" && export PORT=3000 BROWSER=none NODE_ENV=development && npm start"'
sleep 15

# 检查前端是否运行
echo "[步骤8] 检查前端服务..."
MAX_ATTEMPTS=10
ATTEMPT=1
FRONTEND_READY=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "检查前端服务 (尝试 $ATTEMPT/$MAX_ATTEMPTS)..."
  if curl -s http://localhost:3000 | grep -q "root"; then
    echo "✅ 前端服务已成功启动!"
    FRONTEND_READY=true
    break
  else
    echo "⏳ 等待前端启动..."
    sleep 3
  fi
  ATTEMPT=$((ATTEMPT+1))
done

if [ "$FRONTEND_READY" = true ] && [ "$BACKEND_READY" = true ]; then
  echo "✅ 前端和后端服务已成功启动!"
  echo "  前端地址: http://localhost:3000"
  echo "  后端API地址: http://localhost:3001/api"
  echo ""
  echo "即将在浏览器中打开前端应用..."
  open http://localhost:3000
else
  echo "❌ 服务启动失败"
  if [ "$BACKEND_READY" = false ]; then
    echo "  - 后端服务未启动，请检查端口3001"
  fi
  if [ "$FRONTEND_READY" = false ]; then
    echo "  - 前端服务未启动，请检查端口3000"
  fi
  echo "请查看终端窗口了解详细错误"
fi

echo "==============================================="
echo "修复完成"
echo "===============================================" 
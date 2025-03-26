#!/bin/bash

echo "============== 前海读书会管理系统终极修复工具 =============="
echo "此脚本将彻底解决前端和后端访问问题"

# 步骤1: 彻底结束所有进程
echo "[步骤1] 彻底终止所有Node相关进程..."
killall -9 node 2>/dev/null || true
killall -9 nodemon 2>/dev/null || true
sleep 2

# 步骤2: 完全释放所有端口
echo "[步骤2] 完全释放所有端口..."
for port in $(seq 3000 3010); do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
sleep 2

# 步骤3: 记录当前目录
CURRENT_DIR=$(pwd)
echo "[步骤3] 当前工作目录: $CURRENT_DIR"

# 步骤4: 清理任何可能的临时文件
echo "[步骤4] 清理临时文件..."
rm -rf node_modules/.cache 2>/dev/null

# 步骤5: 确保.env文件包含正确的配置
echo "[步骤5] 检查环境变量配置..."
if [ ! -f .env ]; then
  echo "创建.env文件..."
  cat > .env << EOL
# Notion API 凭证
NOTION_API_KEY=ntn_K4814712237IV0ffPLaPRtBhplU2jRXIWZ9K22Fj5JX6GQ
NOTION_PAGE_ID=your_page_id_here

# 数据库ID
NOTION_BOOKLIST_DATABASE_ID=022ed4dc-aee3-4a06-a2d0-524b00cb5bec
NOTION_BOOKLIST_NAME=书单

# 服务器配置
FRONTEND_PORT=3000
BACKEND_PORT=3001
PORT=3001
TEST_MODE=false
NODE_ENV=development
EOL
fi

# 步骤6: 确保antd样式正确导入
echo "[步骤6] 检查React样式导入..."
sed -i '' 's/antd\/dist\/reset.css/antd\/dist\/antd.css/g' src/index.js 2>/dev/null

# 步骤7: 在新终端窗口启动后端
echo "[步骤7] 启动后端服务器 (端口3001)..."
osascript -e 'tell application "Terminal" to do script "cd \"'$CURRENT_DIR'\" && export PORT=3001 && npm run server"'
sleep 5

# 步骤8: 验证后端是否启动成功
echo "[步骤8] 验证后端服务..."
MAX_ATTEMPTS=5
ATTEMPT=1
BACKEND_READY=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "尝试连接后端 (尝试 $ATTEMPT/$MAX_ATTEMPTS)..."
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

if [ "$BACKEND_READY" = false ]; then
  echo "❌ 后端服务器未能成功启动。请查看终端窗口了解详情。"
else
  # 步骤9: 在新终端窗口启动前端
  echo "[步骤9] 启动前端应用 (端口3000)..."
  osascript -e 'tell application "Terminal" to do script "cd \"'$CURRENT_DIR'\" && export PORT=3000 BROWSER=none && npm run client"'
  sleep 10

  # 步骤10: 自动打开浏览器
  echo "[步骤10] 打开浏览器访问前端..."
  open http://localhost:3000
fi

echo "============== 修复完成 =============="
echo "前端地址: http://localhost:3000"
echo "后端API地址: http://localhost:3001/api/leaders"
echo ""
echo "如需更多帮助，请查看新打开的终端窗口的详细日志信息" 
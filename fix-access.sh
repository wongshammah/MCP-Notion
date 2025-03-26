#!/bin/bash

echo "======== 修复前海读书会管理系统访问问题 ========"
echo "1. 停止所有Node进程..."
killall -9 node 2>/dev/null || true
sleep 2

echo "2. 设置正确的环境变量..."
export PORT=3001
export NODE_ENV=development
export TEST_MODE=false
export REACT_APP_API_URL=http://localhost:3001

echo "3. 清理端口..."
lsof -t -i:3000 | xargs kill -9 2>/dev/null || true
lsof -t -i:3001 | xargs kill -9 2>/dev/null || true
sleep 2

echo "4. 启动前端服务... (在新窗口)"
osascript -e 'tell app "Terminal" to do script "cd '$PWD' && export PORT=3000 BROWSER=none && npm run client"'

echo "5. 启动后端服务... (在新窗口)"
osascript -e 'tell app "Terminal" to do script "cd '$PWD' && export PORT=3001 && npm run server"'

echo "======== 启动完成 ========"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:3001"
echo "请在浏览器中访问前端地址" 
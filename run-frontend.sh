#!/bin/bash

# 杀死可能占用3000端口的进程
echo "正在释放端口3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 等待端口释放
sleep 2

# 设置环境变量
export PORT=3000
export BROWSER=none
export REACT_APP_API_URL=http://localhost:3001

# 启动前端
echo "正在启动前端应用..."
npm start 
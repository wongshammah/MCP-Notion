#!/bin/bash

# 停止可能已经运行的服务器进程
echo "停止可能已经运行的Node进程..."
lsof -i :3000 -t | xargs kill -9 2>/dev/null
lsof -i :3001 -t | xargs kill -9 2>/dev/null

# 等待端口释放
sleep 1

# 设置环境变量
export PORT=3000
export SERVER_PORT=3001

# 启动后端服务
echo "启动后端服务..."
node src/server-index.js &
BACKEND_PID=$!

# 等待后端服务启动
echo "等待后端服务启动..."
sleep 3

# 启动前端应用
echo "启动前端应用..."
npm start &
FRONTEND_PID=$!

# 注册信号处理，当脚本终止时杀死子进程
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

# 等待任意子进程结束
wait $BACKEND_PID $FRONTEND_PID 
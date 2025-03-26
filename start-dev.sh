#!/bin/bash

# 停止可能已经运行的服务器进程
echo "停止可能已经运行的Node进程..."
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:3001) 2>/dev/null

# 等待端口释放
sleep 2
echo "端口已释放"

# 设置环境变量
export PORT=3000
export REACT_APP_API_URL=http://localhost:3001
export NODE_ENV=development

# 启动后端服务
echo "启动后端服务..."
npm run server &
SERVER_PID=$!

# 等待后端服务启动
echo "等待后端服务启动..."
sleep 5

# 启动前端应用
echo "启动前端应用..."
npm start &
CLIENT_PID=$!

# 注册信号处理
trap "echo 停止所有进程...; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM EXIT

echo "所有服务已启动!"
echo "  前端地址: http://localhost:3000"
echo "  后端地址: http://localhost:3001"
echo "按Ctrl+C停止所有服务"

# 等待任意子进程结束或用户中断
wait 
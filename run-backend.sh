#!/bin/bash

# 杀死可能占用3001端口的进程
echo "正在释放端口3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# 等待端口释放
sleep 2

# 设置环境变量
export PORT=3001
export TEST_MODE=false
export NODE_ENV=development

# 启动后端
echo "正在启动后端服务..."
nodemon src/server-index.js 
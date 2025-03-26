const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const leadersRouter = require('./api/leaders');
const schedulesRouter = require('./api/schedules');

// 确保在最开始加载环境变量
const result = dotenv.config();
if (result.error) {
  console.error('环境变量加载失败：', result.error);
} else {
  console.log('环境变量加载成功！');
  console.log('环境变量状态：');
  console.log('- TEST_MODE:', process.env.TEST_MODE ? '已启用' : '未启用');
  console.log('- Notion API Key:', process.env.NOTION_API_KEY ? '已设置' : '未设置');
  console.log('- Notion Database ID:', process.env.NOTION_BOOKLIST_DATABASE_ID ? '已设置' : '未设置');
}

// 设置测试模式，允许在没有Notion API的情况下使用本地数据
global.TEST_MODE = process.env.TEST_MODE === 'true';
if (global.TEST_MODE) {
  console.log('⚠️ 运行在测试模式：使用本地数据，Notion同步功能不可用');
}

const app = express();
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10);
console.log(`尝试在端口 ${BACKEND_PORT} 上启动后端服务器...`);

// 中间件
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// API路由
app.use('/api/leaders', leadersRouter);
app.use('/api/schedules', schedulesRouter);

// 验证Notion API配置
async function validateNotionConfig() {
  if (global.TEST_MODE) {
    console.log('系统运行在测试模式，跳过Notion API验证');
    return;
  }
  
  if (!process.env.NOTION_API_KEY) {
    console.error('错误: 未设置NOTION_API_KEY环境变量');
    return;
  }
  
  if (!process.env.NOTION_BOOKLIST_DATABASE_ID) {
    console.error('错误: 未设置NOTION_BOOKLIST_DATABASE_ID环境变量');
    return;
  }
  
  try {
    const { Client } = require('@notionhq/client');
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    
    console.log('正在验证Notion API密钥和数据库ID...');
    await notion.databases.retrieve({
      database_id: process.env.NOTION_BOOKLIST_DATABASE_ID,
    });
    console.log('✅ Notion API密钥和数据库ID验证成功!');
  } catch (error) {
    console.error('❌ Notion API验证失败:', error.message);
    console.error('请检查您的API密钥和数据库ID是否正确，以及是否有足够的权限访问该数据库');
    console.log('系统将在本地模式下运行，不会与Notion同步');
  }
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 检查端口是否被占用的函数
function checkPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`端口 ${port} 已被占用`);
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// 启动服务器的函数
async function startServer(port) {
  try {
    const isPortInUse = await checkPortInUse(port);
    
    if (isPortInUse) {
      // 尝试下一个端口
      const nextPort = port + 1;
      console.log(`尝试使用备用端口 ${nextPort}`);
      return startServer(nextPort);
    }
    
    // 启动服务器
    app.listen(port, () => {
      console.log(`后端服务器成功运行在 http://localhost:${port}`);
      validateNotionConfig();
    });
    
    return port;
  } catch (error) {
    console.error('启动服务器时出错:', error);
    return null;
  }
}

// 尝试启动服务器
startServer(BACKEND_PORT); 
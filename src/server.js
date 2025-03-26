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
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// API路由
app.use('/api/leaders', leadersRouter);
app.use('/api/schedules', schedulesRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 测试Notion API连接
const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function testNotionConnection() {
  try {
    await notion.databases.query({
      database_id: process.env.NOTION_BOOKLIST_DATABASE_ID
    });
    console.log('Notion API连接测试成功！');
  } catch (error) {
    console.log('Notion API连接测试失败:', error.message);
    console.log('请检查 NOTION_API_KEY 是否正确设置');
  }
}

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  testNotionConnection();
}); 
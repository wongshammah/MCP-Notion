// 确保环境变量在应用启动前加载
require('dotenv').config();

console.log('环境变量加载完成');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('TEST_MODE:', process.env.TEST_MODE);

// 设置测试模式全局变量
const TEST_MODE = process.env.TEST_MODE === 'true';
global.TEST_MODE = TEST_MODE;

console.log(`应用运行在${TEST_MODE ? '测试' : '生产'}模式`);
console.log(`使用的端口: ${process.env.PORT || 3001}`);
console.log('Notion API Key:', process.env.NOTION_API_KEY ? '已配置' : '未配置');
console.log('Notion Database ID:', process.env.NOTION_BOOKLIST_DATABASE_ID ? '已配置' : '未配置');

// 设置uncaughtException处理器
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  console.error('堆栈跟踪:', err.stack);
});

// 设置unhandledRejection处理器
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
});

try {
  // 启动服务器
  console.log('正在尝试启动服务器...');
  require('./server');
  console.log('服务器启动成功');
} catch (error) {
  console.error('服务器启动失败:', error);
} 
/**
 * @fileoverview 完整显示书单数据库中的所有字段
 * 直接从Notion数据库获取并显示所有字段信息，支持按字段过滤
 */

const { Client } = require('@notionhq/client');
const chalk = require('chalk');
const config = require('../src/config-loader');

// 定义过滤条件
const filters = {
  bookName: process.argv[2] || null,      // 书名过滤
  leaderName: process.argv[3] || null,    // 领读人过滤
  hostName: process.argv[4] || null,      // 主持人过滤
  author: process.argv[5] || null,        // 作者过滤
  status: process.argv[6] || null,        // 进度过滤
  date: process.argv[7] || null,          // 日期过滤
  period: process.argv[8] || null         // 期数过滤
};

/**
 * 格式化日期
 * @param {string} dateString - ISO日期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(dateString) {
  if (!dateString) return '未设置';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });
}

/**
 * 获取富文本内容
 * @param {Array} richText - 富文本数组
 * @returns {string} 格式化后的文本内容
 */
function getRichText(richText) {
  if (!richText || !richText[0]) return '未设置';
  return richText[0].plain_text;
}

/**
 * 获取状态文本
 * @param {Object} status - 状态对象
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  if (!status) return '未设置';
  return status.name;
}

/**
 * 检查记录是否匹配过滤条件
 * @param {Object} page - Notion页面对象
 * @returns {boolean} 是否匹配过滤条件
 */
function matchesFilters(page) {
  const bookName = page.properties['书名']?.title[0]?.plain_text;
  const date = page.properties['排期']?.date?.start;
  const leaderName = getRichText(page.properties['领读人']?.rich_text);
  const hostName = getRichText(page.properties['主持人']?.rich_text);
  const author = getRichText(page.properties['作者']?.rich_text);
  const status = getStatusText(page.properties['进度']?.status);
  
  // 从书名中提取期数
  let period = null;
  if (bookName) {
    const match = bookName.match(/第(\d+)期/);
    if (match) {
      period = parseInt(match[1]);
    }
  }

  // 检查每个过滤条件
  if (filters.bookName && !bookName?.includes(filters.bookName)) return false;
  if (filters.leaderName && !leaderName?.includes(filters.leaderName)) return false;
  if (filters.hostName && !hostName?.includes(filters.hostName)) return false;
  if (filters.author && !author?.includes(filters.author)) return false;
  if (filters.status && !status?.includes(filters.status)) return false;
  if (filters.date && !date?.includes(filters.date)) return false;
  if (filters.period && period !== parseInt(filters.period)) return false;

  return true;
}

/**
 * 显示过滤条件说明
 */
function showFilterHelp() {
  console.log(chalk.cyan('\n====== 过滤条件说明 ======\n'));
  console.log(chalk.white('使用方法:'));
  console.log(chalk.yellow('npm run show-full-booklist [书名] [领读人] [主持人] [作者] [进度] [日期] [期数]'));
  console.log(chalk.white('\n示例:'));
  console.log(chalk.gray('npm run show-full-booklist 原则 Apple 未设置 未设置 未设置 2025 1'));
  console.log(chalk.gray('npm run show-full-booklist 圣经 未设置 未设置 未设置 未设置 未设置 未设置'));
  console.log(chalk.gray('npm run show-full-booklist 未设置 未设置 未设置 未设置 未设置 未设置 1'));
  console.log(chalk.white('\n注意:'));
  console.log(chalk.gray('- 所有参数都是可选的'));
  console.log(chalk.gray('- 使用"未设置"来匹配空值'));
  console.log(chalk.gray('- 日期格式为YYYY-MM-DD'));
  console.log(chalk.gray('- 期数必须是数字'));
  console.log(chalk.gray('- 其他字段支持模糊匹配'));
}

/**
 * 显示完整的书单信息
 */
async function showFullBooklist() {
  try {
    const notion = new Client({ auth: config.notion.apiKey });
    const dbId = config.getDatabaseId('booklist');
    
    console.log(chalk.cyan('====== 前海读书会书单数据库 ======\n'));
    console.log(chalk.yellow(`数据库: ${config.databases.booklist.name} (${dbId})`));
    
    // 获取数据库内容，按时间从近到远排序
    const response = await notion.databases.query({
      database_id: dbId,
      sorts: [
        {
          property: '排期',
          direction: 'descending'
        }
      ]
    });

    // 应用过滤条件
    const filteredResults = response.results.filter(matchesFilters);
    
    console.log(chalk.green(`\n共找到 ${response.results.length} 条记录`));
    console.log(chalk.yellow(`符合过滤条件的记录: ${filteredResults.length} 条\n`));

    // 显示每条记录的完整信息
    filteredResults.forEach((page, index) => {
      const bookName = page.properties['书名']?.title[0]?.plain_text;
      const date = page.properties['排期']?.date?.start;
      const leaderName = getRichText(page.properties['领读人']?.rich_text);
      const hostName = getRichText(page.properties['主持人']?.rich_text);
      const author = getRichText(page.properties['作者']?.rich_text);
      const status = getStatusText(page.properties['进度']?.status);
      
      // 从书名中提取期数
      let period = null;
      if (bookName) {
        const match = bookName.match(/第(\d+)期/);
        if (match) {
          period = parseInt(match[1]);
        }
      }

      console.log(chalk.cyan(`\n[记录 ${index + 1}]`));
      console.log(chalk.gray('='.repeat(80)));
      console.log(chalk.white.bold('书名:'), chalk.white(bookName || '未设置'));
      console.log(chalk.white.bold('期数:'), chalk.yellow(period ? `第${period}期` : '未知'));
      console.log(chalk.white.bold('排期:'), chalk.green(formatDate(date)));
      console.log(chalk.white.bold('领读人:'), chalk.blue(leaderName));
      console.log(chalk.white.bold('主持人:'), chalk.magenta(hostName));
      console.log(chalk.white.bold('作者:'), chalk.cyan(author));
      console.log(chalk.white.bold('进度:'), chalk.yellow(status));
      console.log(chalk.gray('='.repeat(80)));
    });

    // 显示统计信息
    console.log(chalk.cyan('\n====== 统计信息 ======\n'));
    const total = filteredResults.length;
    const withLeader = filteredResults.filter(page => page.properties['领读人']?.rich_text[0]).length;
    const withHost = filteredResults.filter(page => page.properties['主持人']?.rich_text[0]).length;
    const withAuthor = filteredResults.filter(page => page.properties['作者']?.rich_text[0]).length;
    
    console.log(chalk.white(`总记录数: ${total}`));
    console.log(chalk.blue(`已指定领读人: ${withLeader} (${((withLeader/total)*100).toFixed(1)}%)`));
    console.log(chalk.magenta(`已指定主持人: ${withHost} (${((withHost/total)*100).toFixed(1)}%)`));
    console.log(chalk.cyan(`已指定作者: ${withAuthor} (${((withAuthor/total)*100).toFixed(1)}%)`));

    // 显示过滤条件说明
    showFilterHelp();

  } catch (error) {
    console.error(chalk.red('获取书单数据失败:'), error);
  }
}

// 执行主函数
showFullBooklist(); 
/**
 * @fileoverview 书单数据分析工具
 * 读取本地存储的书单数据，进行数据分析和统计展示
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 定义书单文件路径
const schedulePath = path.join(__dirname, '../config/book-schedule.json');

/**
 * 读取书单文件
 * @returns {Object|null} 书单数据对象或null（如果读取失败）
 */
function readScheduleFile() {
  try {
    const data = fs.readFileSync(schedulePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(chalk.red('读取书单文件失败:'), err);
    return null;
  }
}

/**
 * 分析书单数据，提取统计信息
 * @param {Array} schedule 书单数据数组
 * @returns {Object} 统计信息
 */
function analyzeScheduleData(schedule) {
  // 按年份分组
  const booksByYear = {};
  // 收集所有领读人
  const leaders = new Set();
  // 领读人频率
  const leaderFrequency = {};
  
  schedule.forEach(item => {
    // 解析年份
    const year = item.date ? item.date.split('-')[0] : '未知';
    
    // 按年份计数
    if (!booksByYear[year]) {
      booksByYear[year] = [];
    }
    booksByYear[year].push(item);
    
    // 统计领读人
    if (item.leaderName) {
      leaders.add(item.leaderName);
      leaderFrequency[item.leaderName] = (leaderFrequency[item.leaderName] || 0) + 1;
    }
  });
  
  return {
    totalBooks: schedule.length,
    booksByYear,
    uniqueLeadersCount: leaders.size,
    leaderFrequency
  };
}

/**
 * 展示书单列表
 * @param {Array} schedule 书单数据
 */
function displayScheduleList(schedule) {
  // 按日期降序排序
  const sortedSchedule = [...schedule].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
  
  console.log(chalk.cyan('\n==== 书单列表 ===='));
  
  // 当前年份
  let currentYear = null;
  
  sortedSchedule.forEach((item, index) => {
    const year = item.date ? item.date.split('-')[0] : '未知';
    
    // 如果年份变化，打印年份标题
    if (year !== currentYear) {
      currentYear = year;
      console.log(chalk.yellow(`\n【${currentYear}年】`));
    }
    
    console.log(
      chalk.green(`${index + 1}.`),
      chalk.white(`日期: ${item.date || '未排期'}`),
      chalk.yellow(`书名: ${item.bookName || '未指定'}`),
      chalk.blue(`领读人: ${item.leaderName || '未指定'}`),
      item.period ? chalk.gray(`周期: ${item.period}`) : ''
    );
  });
}

/**
 * 展示数据分析结果
 * @param {Object} analysis 分析结果
 */
function displayAnalysis(analysis) {
  console.log(chalk.cyan('\n==== 数据分析 ===='));
  console.log(chalk.white(`总书目数量: ${analysis.totalBooks}`));
  
  // 展示年度分布
  console.log(chalk.yellow('\n年度分布:'));
  Object.keys(analysis.booksByYear).sort().forEach(year => {
    console.log(chalk.white(`- ${year}年: ${analysis.booksByYear[year].length}本`));
  });
  
  // 展示领读人统计
  console.log(chalk.yellow('\n领读人统计:'));
  console.log(chalk.white(`- 独立领读人数量: ${analysis.uniqueLeadersCount}`));
  
  // 展示领读频率最高的人
  const sortedLeaders = Object.entries(analysis.leaderFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sortedLeaders.length > 0) {
    console.log(chalk.yellow('\n领读频率最高:'));
    sortedLeaders.forEach(([leader, count], index) => {
      console.log(chalk.white(`${index + 1}. ${leader}: ${count}次`));
    });
  }
}

/**
 * 主函数
 */
function main() {
  const scheduleData = readScheduleFile();
  if (!scheduleData || !scheduleData.schedule || scheduleData.schedule.length === 0) {
    console.log(chalk.red('没有可用的书单信息。'));
    return;
  }
  
  console.log(chalk.yellow(`数据最后更新时间: ${new Date(scheduleData.lastUpdated).toLocaleString()}`));
  console.log(chalk.green(`共找到 ${scheduleData.schedule.length} 条书单记录。`));
  
  // 分析数据
  const analysis = analyzeScheduleData(scheduleData.schedule);
  
  // 展示书单列表
  displayScheduleList(scheduleData.schedule);
  
  // 展示分析结果
  displayAnalysis(analysis);
}

// 执行主函数
main(); 
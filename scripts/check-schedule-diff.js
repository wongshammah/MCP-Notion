/**
 * @fileoverview 排期对比脚本
 * 对比本地排期与Notion中的书单数据，显示差异并提供更新建议
 */

const fs = require('fs');
const path = require('path');
const BookScheduleManager = require('../src/book-schedule-manager');
const config = require('../src/config-loader');
const chalk = require('chalk');

/**
 * 读取本地排期文件
 * @param {string} filePath - 排期文件路径
 * @returns {Array} 排期列表
 */
function readLocalSchedule(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(chalk.yellow('本地排期文件不存在，将创建新文件'));
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.schedule || [];
  } catch (error) {
    console.error(chalk.red('读取本地排期失败:'), error.message);
    return [];
  }
}

/**
 * 比较两个排期项目是否相同
 * @param {Object} item1 - 第一个排期项目
 * @param {Object} item2 - 第二个排期项目
 * @returns {boolean} 两个项目是否相同
 */
function isSameScheduleItem(item1, item2) {
  return item1.date === item2.date && 
         item1.bookName === item2.bookName && 
         ((!item1.leaderName && !item2.leaderName) || 
          (item1.leaderName === item2.leaderName));
}

/**
 * 找出两个排期列表的差异
 * @param {Array} localSchedule - 本地排期列表
 * @param {Array} notionSchedule - Notion排期列表
 * @returns {Object} 差异信息
 */
function findDifferences(localSchedule, notionSchedule) {
  // 按日期索引排期项目
  const localByDate = {};
  const notionByDate = {};
  
  localSchedule.forEach(item => {
    localByDate[item.date] = item;
  });
  
  notionSchedule.forEach(item => {
    notionByDate[item.date] = item;
  });
  
  // 查找差异
  const onlyInLocal = [];
  const onlyInNotion = [];
  const different = [];
  
  // 检查本地有但Notion没有的排期
  Object.values(localByDate).forEach(localItem => {
    const notionItem = notionByDate[localItem.date];
    if (!notionItem) {
      onlyInLocal.push(localItem);
    } else if (!isSameScheduleItem(localItem, notionItem)) {
      different.push({
        local: localItem,
        notion: notionItem
      });
    }
  });
  
  // 检查Notion有但本地没有的排期
  Object.values(notionByDate).forEach(notionItem => {
    if (!localByDate[notionItem.date]) {
      onlyInNotion.push(notionItem);
    }
  });
  
  return {
    onlyInLocal,
    onlyInNotion,
    different
  };
}

/**
 * 格式化排期项显示
 * @param {Object} item - 排期项
 * @returns {string} 格式化的字符串
 */
function formatScheduleItem(item) {
  return `${item.date} - ${item.bookName}${item.leaderName ? ` (领读人: ${item.leaderName})` : ''}`;
}

/**
 * 显示排期差异
 * @param {Object} diff - 差异信息
 */
function displayDifferences(diff) {
  console.log(chalk.bold('\n排期差异分析结果:'));
  
  if (diff.onlyInLocal.length === 0 && diff.onlyInNotion.length === 0 && diff.different.length === 0) {
    console.log(chalk.green('✓ 本地排期与Notion排期完全一致'));
    return;
  }
  
  // 显示本地有但Notion没有的排期
  if (diff.onlyInLocal.length > 0) {
    console.log(chalk.yellow('\n本地有但Notion中不存在的排期:'));
    diff.onlyInLocal.forEach(item => {
      console.log(chalk.yellow(`+ ${formatScheduleItem(item)}`));
    });
  }
  
  // 显示Notion有但本地没有的排期
  if (diff.onlyInNotion.length > 0) {
    console.log(chalk.red('\nNotion中有但本地不存在的排期:'));
    diff.onlyInNotion.forEach(item => {
      console.log(chalk.red(`- ${formatScheduleItem(item)}`));
    });
  }
  
  // 显示内容不同的排期
  if (diff.different.length > 0) {
    console.log(chalk.cyan('\n内容不一致的排期:'));
    diff.different.forEach(({local, notion}) => {
      console.log(chalk.cyan(`* ${local.date}:`));
      console.log(chalk.green(`  本地: ${formatScheduleItem(local)}`));
      console.log(chalk.magenta(`  Notion: ${formatScheduleItem(notion)}`));
    });
  }
  
  // 显示建议
  console.log(chalk.bold('\n建议操作:'));
  
  if (diff.onlyInLocal.length > 0) {
    console.log(chalk.yellow('需要添加到Notion: ') + diff.onlyInLocal.length + '项');
  }
  
  if (diff.onlyInNotion.length > 0) {
    console.log(chalk.red('需要添加到本地: ') + diff.onlyInNotion.length + '项');
  }
  
  if (diff.different.length > 0) {
    console.log(chalk.cyan('需要更新的冲突项: ') + diff.different.length + '项');
  }
  
  console.log(chalk.bold('\n更新方法:'));
  console.log('1. 将本地排期同步到Notion:');
  console.log('   - 手动在Notion中添加缺失的排期项');
  console.log('   - 修改Notion中有冲突的排期项');
  console.log('2. 更新本地排期:');
  console.log('   - 运行 node scripts/fetch-book-schedule.js');
  console.log('3. 再次运行此脚本检查是否同步完成:');
  console.log('   - node scripts/check-schedule-diff.js');
}

/**
 * 执行排期对比
 */
async function compareSchedules() {
  try {
    console.log(chalk.bold('开始对比排期信息...'));
    
    // 读取本地排期
    const localSchedulePath = path.join(__dirname, '../config/book-schedule.json');
    const localSchedule = readLocalSchedule(localSchedulePath);
    console.log(chalk.blue(`已读取本地排期: ${localSchedule.length}项`));
    
    // 获取Notion排期
    const manager = new BookScheduleManager();
    const notionSchedule = await manager.fetchBookSchedule();
    console.log(chalk.blue(`已读取Notion排期: ${notionSchedule.length}项`));
    
    // 对比差异
    const differences = findDifferences(localSchedule, notionSchedule);
    
    // 显示差异
    displayDifferences(differences);
    
  } catch (error) {
    console.error(chalk.red('\n对比排期失败:'), error.message);
  }
}

// 执行排期对比
compareSchedules(); 
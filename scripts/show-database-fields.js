/**
 * @fileoverview 显示书单数据库的所有字段及其结构
 * 读取本地存储的书单数据，分析并展示所有存在的字段
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Client } = require('@notionhq/client');
const config = require('../src/config-loader');

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
 * 获取Notion数据库结构
 * @returns {Promise<Object>} 数据库结构信息
 */
async function getNotionDatabaseStructure() {
  try {
    const notion = new Client({ auth: config.notion.apiKey });
    const dbId = config.getDatabaseId('booklist');
    
    const response = await notion.databases.retrieve({
      database_id: dbId
    });
    
    return response.properties;
  } catch (error) {
    console.error(chalk.red('获取Notion数据库结构失败:'), error);
    return null;
  }
}

/**
 * 分析书单数据中的所有字段
 * @param {Array} schedule 书单数据数组
 * @returns {Object} 字段分析结果
 */
function analyzeFields(schedule) {
  // 字段统计
  const fieldStats = {};
  
  // 记录每个字段的类型和出现次数
  schedule.forEach(item => {
    Object.entries(item).forEach(([key, value]) => {
      if (!fieldStats[key]) {
        fieldStats[key] = {
          count: 0,
          types: new Set(),
          examples: [],
          nonNullCount: 0
        };
      }
      
      fieldStats[key].count++;
      
      if (value !== null && value !== undefined) {
        fieldStats[key].nonNullCount++;
        fieldStats[key].types.add(typeof value);
        
        // 收集不同类型的示例值（最多5个）
        if (fieldStats[key].examples.length < 5 && 
            !fieldStats[key].examples.includes(value)) {
          fieldStats[key].examples.push(value);
        }
      }
    });
  });
  
  return fieldStats;
}

/**
 * 显示数据库字段分析结果
 */
async function showDatabaseFields() {
  // 获取Notion数据库结构
  console.log(chalk.cyan('====== Notion数据库原始字段 ======\n'));
  const notionStructure = await getNotionDatabaseStructure();
  if (notionStructure) {
    console.log(chalk.bold('Notion数据库字段:'));
    console.log(chalk.gray('='.repeat(80)));
    Object.entries(notionStructure).forEach(([key, value]) => {
      console.log(
        chalk.green(key.padEnd(20)),
        chalk.yellow(value.type.padEnd(15)),
        chalk.white(value.description || '无描述')
      );
    });
    console.log(chalk.gray('='.repeat(80)));
  }
  
  // 获取本地数据
  const scheduleData = readScheduleFile();
  if (!scheduleData || !scheduleData.schedule || scheduleData.schedule.length === 0) {
    console.log(chalk.red('没有可用的书单信息。'));
    return;
  }
  
  console.log(chalk.cyan('\n====== 本地数据字段 ======\n'));
  console.log(chalk.yellow(`数据最后更新时间: ${new Date(scheduleData.lastUpdated).toLocaleString()}`));
  console.log(chalk.green(`共找到 ${scheduleData.schedule.length} 条书单记录\n`));
  
  // 分析字段
  const fieldStats = analyzeFields(scheduleData.schedule);
  
  // 展示字段分析结果
  console.log(chalk.bold('本地数据字段:'));
  console.log(chalk.gray('='.repeat(80)));
  console.log(
    chalk.white.bold('字段名'.padEnd(15)),
    chalk.white.bold('出现次数'.padEnd(10)),
    chalk.white.bold('非空值'.padEnd(10)),
    chalk.white.bold('数据类型'.padEnd(15)),
    chalk.white.bold('示例值')
  );
  console.log(chalk.gray('='.repeat(80)));
  
  // 按字段名排序
  Object.entries(fieldStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([field, stats]) => {
      const fieldName = field;
      const count = stats.count;
      const nonNullCount = stats.nonNullCount;
      const types = Array.from(stats.types).join(', ');
      const examples = stats.examples.map(ex => 
        typeof ex === 'string' ? `"${ex}"` : ex
      ).join(', ');
      
      console.log(
        chalk.green(fieldName.padEnd(15)),
        chalk.yellow(`${count}/${scheduleData.schedule.length}`.padEnd(10)),
        chalk.blue(`${nonNullCount}`.padEnd(10)),
        chalk.magenta(types.padEnd(15)),
        chalk.white(examples.substring(0, 40) + (examples.length > 40 ? '...' : ''))
      );
    });
  
  console.log(chalk.gray('='.repeat(80)));
  console.log(chalk.white(`\n总计 ${Object.keys(fieldStats).length} 个字段存在于本地数据中。`));
  
  // 显示数据结构示例
  console.log(chalk.cyan('\n====== 书单条目示例 ======\n'));
  const exampleItem = scheduleData.schedule[0];
  console.log(JSON.stringify(exampleItem, null, 2));
}

// 执行主函数
showDatabaseFields(); 
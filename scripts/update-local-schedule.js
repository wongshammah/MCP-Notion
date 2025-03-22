/**
 * @fileoverview 本地排期更新工具
 * 允许在本地添加、修改或删除排期，并与Notion同步
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

// 配置文件路径
const schedulePath = path.join(__dirname, '../config/book-schedule.json');

/**
 * 读取本地排期文件
 * @returns {Object} 排期数据对象
 */
function readScheduleFile() {
  try {
    if (!fs.existsSync(schedulePath)) {
      return { lastUpdated: new Date().toISOString(), schedule: [] };
    }
    
    return JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  } catch (error) {
    console.error(chalk.red('读取排期文件失败:'), error.message);
    return { lastUpdated: new Date().toISOString(), schedule: [] };
  }
}

/**
 * 保存排期数据到文件
 * @param {Object} data - 排期数据对象
 */
function saveScheduleFile(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(schedulePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(chalk.green('排期数据已保存到:'), schedulePath);
  } catch (error) {
    console.error(chalk.red('保存排期数据失败:'), error.message);
  }
}

/**
 * 显示排期列表
 * @param {Array} schedule - 排期列表
 */
function displaySchedule(schedule) {
  console.log(chalk.bold('\n当前排期列表:'));
  
  if (schedule.length === 0) {
    console.log(chalk.yellow('暂无排期数据'));
    return;
  }
  
  // 按日期排序
  const sortedSchedule = [...schedule].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  sortedSchedule.forEach((item, index) => {
    console.log(chalk.blue(`[${index + 1}] ${item.date} - ${item.bookName}${item.leaderName ? ` (领读人: ${item.leaderName})` : ''}`));
  });
}

/**
 * 添加新排期
 * @param {Array} schedule - 现有排期列表
 * @returns {Promise<Array>} 更新后的排期列表
 */
async function addSchedule(schedule) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  try {
    console.log(chalk.bold('\n添加新排期:'));
    
    const date = await question(chalk.cyan('请输入日期 (YYYY-MM-DD): '));
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log(chalk.red('日期格式无效，请使用YYYY-MM-DD格式'));
      rl.close();
      return schedule;
    }
    
    // 检查日期是否已存在
    const existingItem = schedule.find(item => item.date === date);
    if (existingItem) {
      console.log(chalk.yellow(`警告: 日期 ${date} 的排期已存在`));
      const override = await question(chalk.yellow('是否覆盖? (y/N): '));
      if (override.toLowerCase() !== 'y') {
        console.log(chalk.yellow('取消添加'));
        rl.close();
        return schedule;
      }
      // 删除现有排期
      schedule = schedule.filter(item => item.date !== date);
    }
    
    const bookName = await question(chalk.cyan('请输入书名: '));
    if (!bookName.trim()) {
      console.log(chalk.red('书名不能为空'));
      rl.close();
      return schedule;
    }
    
    const leaderName = await question(chalk.cyan('请输入领读人 (可选): '));
    
    // 提取期数（如果在书名中包含）
    let period = null;
    const match = bookName.match(/第(\d+)期/);
    if (match) {
      period = parseInt(match[1]);
    } else {
      const periodInput = await question(chalk.cyan('请输入期数 (如无则留空): '));
      if (periodInput.trim() && !isNaN(parseInt(periodInput))) {
        period = parseInt(periodInput);
      }
    }
    
    // 创建新排期项
    const newItem = {
      period,
      date,
      bookName,
      leaderName: leaderName.trim() || undefined
    };
    
    // 添加到排期列表
    schedule.push(newItem);
    console.log(chalk.green('\n成功添加排期:'));
    console.log(chalk.green(`- 日期: ${date}`));
    console.log(chalk.green(`- 书名: ${bookName}`));
    console.log(chalk.green(`- 领读人: ${leaderName || '未指定'}`));
    console.log(chalk.green(`- 期数: ${period || '未指定'}`));
    
    rl.close();
    return schedule;
  } catch (error) {
    console.error(chalk.red('添加排期失败:'), error.message);
    rl.close();
    return schedule;
  }
}

/**
 * 修改现有排期
 * @param {Array} schedule - 现有排期列表
 * @returns {Promise<Array>} 更新后的排期列表
 */
async function editSchedule(schedule) {
  if (schedule.length === 0) {
    console.log(chalk.yellow('暂无排期数据可编辑'));
    return schedule;
  }
  
  displaySchedule(schedule);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  try {
    const indexInput = await question(chalk.cyan('\n请输入要编辑的排期序号: '));
    const index = parseInt(indexInput) - 1;
    
    if (isNaN(index) || index < 0 || index >= schedule.length) {
      console.log(chalk.red('无效的序号'));
      rl.close();
      return schedule;
    }
    
    const item = schedule[index];
    console.log(chalk.bold('\n编辑排期:'));
    console.log(chalk.blue(`当前值: ${item.date} - ${item.bookName}${item.leaderName ? ` (领读人: ${item.leaderName})` : ''}`));
    
    const date = await question(chalk.cyan(`日期 [${item.date}]: `));
    const bookName = await question(chalk.cyan(`书名 [${item.bookName}]: `));
    const leaderName = await question(chalk.cyan(`领读人 [${item.leaderName || '未指定'}]: `));
    const periodInput = await question(chalk.cyan(`期数 [${item.period || '未指定'}]: `));
    
    // 更新排期项
    schedule[index] = {
      period: periodInput.trim() ? parseInt(periodInput) : item.period,
      date: date.trim() || item.date,
      bookName: bookName.trim() || item.bookName,
      leaderName: leaderName.trim() || item.leaderName
    };
    
    console.log(chalk.green('\n成功更新排期'));
    
    rl.close();
    return schedule;
  } catch (error) {
    console.error(chalk.red('编辑排期失败:'), error.message);
    rl.close();
    return schedule;
  }
}

/**
 * 删除排期
 * @param {Array} schedule - 现有排期列表
 * @returns {Promise<Array>} 更新后的排期列表
 */
async function deleteSchedule(schedule) {
  if (schedule.length === 0) {
    console.log(chalk.yellow('暂无排期数据可删除'));
    return schedule;
  }
  
  displaySchedule(schedule);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  try {
    const indexInput = await question(chalk.cyan('\n请输入要删除的排期序号: '));
    const index = parseInt(indexInput) - 1;
    
    if (isNaN(index) || index < 0 || index >= schedule.length) {
      console.log(chalk.red('无效的序号'));
      rl.close();
      return schedule;
    }
    
    const item = schedule[index];
    console.log(chalk.red(`\n即将删除: ${item.date} - ${item.bookName}`));
    
    const confirm = await question(chalk.red('确认删除? (y/N): '));
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.yellow('取消删除'));
      rl.close();
      return schedule;
    }
    
    // 删除排期项
    schedule.splice(index, 1);
    console.log(chalk.green('成功删除排期'));
    
    rl.close();
    return schedule;
  } catch (error) {
    console.error(chalk.red('删除排期失败:'), error.message);
    rl.close();
    return schedule;
  }
}

/**
 * 获取操作选择
 * @returns {Promise<string>} 用户选择的操作
 */
async function getAction() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(chalk.bold('\n本地排期管理工具'));
  console.log(chalk.cyan('1. 查看排期列表'));
  console.log(chalk.cyan('2. 添加新排期'));
  console.log(chalk.cyan('3. 编辑排期'));
  console.log(chalk.cyan('4. 删除排期'));
  console.log(chalk.cyan('5. 保存并退出'));
  console.log(chalk.cyan('6. 退出不保存'));
  
  const action = await new Promise(resolve => {
    rl.question(chalk.bold('\n请选择操作: '), resolve);
  });
  
  rl.close();
  return action;
}

/**
 * 主函数
 */
async function main() {
  console.log(chalk.bold('读取排期数据...'));
  let scheduleData = readScheduleFile();
  let schedule = scheduleData.schedule;
  let modified = false;
  
  while (true) {
    const action = await getAction();
    
    switch (action) {
      case '1':
        displaySchedule(schedule);
        break;
        
      case '2':
        schedule = await addSchedule(schedule);
        modified = true;
        break;
        
      case '3':
        schedule = await editSchedule(schedule);
        modified = true;
        break;
        
      case '4':
        schedule = await deleteSchedule(schedule);
        modified = true;
        break;
        
      case '5':
        if (modified) {
          scheduleData.schedule = schedule;
          saveScheduleFile(scheduleData);
          console.log(chalk.green('\n排期数据已保存'));
          console.log(chalk.blue('提示: 运行 npm run check-schedule 可检查与Notion的差异'));
        }
        console.log(chalk.bold('程序已退出'));
        return;
        
      case '6':
        if (modified) {
          console.log(chalk.yellow('\n警告: 修改未保存'));
        }
        console.log(chalk.bold('程序已退出'));
        return;
        
      default:
        console.log(chalk.red('无效操作，请重新选择'));
    }
  }
}

// 执行主程序
main().catch(error => {
  console.error(chalk.red('程序执行失败:'), error.message);
}); 
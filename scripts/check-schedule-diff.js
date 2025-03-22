/**
 * @fileoverview 检查本地排期与Notion数据库的差异
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const BookScheduleManager = require('../src/book-schedule-manager');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 封装readline.question为Promise
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * 显示差异分析结果
 * @param {Object} diff - 差异分析结果
 */
function displayDiff(diff) {
  console.log('\n排期差异分析结果:');
  
  if (diff.localOnly.length > 0) {
    console.log('\n本地有但Notion中不存在的排期:');
    diff.localOnly.forEach(item => {
      console.log(`+ ${item.date} - ${item.bookName} (领读人: ${item.leaderName})`);
    });
  }
  
  if (diff.notionOnly.length > 0) {
    console.log('\nNotion中有但本地不存在的排期:');
    diff.notionOnly.forEach(item => {
      console.log(`- ${item.date} - ${item.bookName} (领读人: ${item.leaderName})`);
    });
  }
  
  if (diff.conflicts.length > 0) {
    console.log('\n存在冲突的排期:');
    diff.conflicts.forEach(conflict => {
      console.log(`! ${conflict.date} - ${conflict.bookName}`);
      console.log(`  本地: 领读人 ${conflict.local.leaderName}`);
      console.log(`  Notion: 领读人 ${conflict.notion.leaderName}`);
    });
  }
  
  if (diff.localOnly.length === 0 && 
      diff.notionOnly.length === 0 && 
      diff.conflicts.length === 0) {
    console.log('✓ 本地排期与Notion排期完全一致');
  }
}

/**
 * 显示操作选项
 * @param {Object} diff - 差异分析结果
 */
async function showOptions(diff) {
  if (diff.localOnly.length === 0 && 
      diff.notionOnly.length === 0 && 
      diff.conflicts.length === 0) {
    return;
  }

  console.log('\n请选择下一步操作:');
  console.log('1. 将本地排期同步到Notion');
  console.log('2. 从Notion更新本地排期');
  console.log('3. 查看详细差异信息');
  console.log('4. 退出');
  
  const answer = await question('\n请输入选项编号 (1-4): ');
  
  switch (answer) {
    case '1':
      console.log('\n同步到Notion的步骤:');
      console.log('1. 手动在Notion中添加缺失的排期项');
      console.log('2. 修改Notion中有冲突的排期项');
      console.log('3. 完成后运行 npm run fetch-schedule 更新本地数据');
      console.log('4. 再次运行 npm run check-schedule 确认同步完成');
      break;
      
    case '2':
      console.log('\n正在从Notion更新本地排期...');
      const manager = new BookScheduleManager();
      try {
        await manager.fetchBookSchedule();
        console.log('本地排期已更新');
      } catch (error) {
        console.error('更新失败:', error);
      }
      break;
      
    case '3':
      console.log('\n详细差异信息:');
      if (diff.localOnly.length > 0) {
        console.log('\n本地独有的排期详情:');
        diff.localOnly.forEach(item => {
          console.log(JSON.stringify(item, null, 2));
        });
      }
      if (diff.notionOnly.length > 0) {
        console.log('\nNotion独有的排期详情:');
        diff.notionOnly.forEach(item => {
          console.log(JSON.stringify(item, null, 2));
        });
      }
      if (diff.conflicts.length > 0) {
        console.log('\n冲突排期详情:');
        diff.conflicts.forEach(conflict => {
          console.log(JSON.stringify(conflict, null, 2));
        });
      }
      break;
      
    case '4':
      console.log('已退出');
      break;
      
    default:
      console.log('无效的选项，已退出');
  }
  
  rl.close();
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始对比排期信息...');
    
    // 读取本地排期
    const schedulePath = path.join(__dirname, '../config/book-schedule.json');
    const localData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    console.log(`已读取本地排期: ${localData.schedule.length}项`);
    
    // 读取Notion排期
    const manager = new BookScheduleManager();
    const notionSchedule = await manager.fetchBookSchedule();
    console.log(`已读取Notion排期: ${notionSchedule.length}项`);
    
    // 分析差异
    const diff = {
      localOnly: [],
      notionOnly: [],
      conflicts: []
    };
    
    // 检查本地独有的排期
    localData.schedule.forEach(localItem => {
      const notionItem = notionSchedule.find(item => 
        item.date === localItem.date && item.bookName === localItem.bookName
      );
      
      if (!notionItem) {
        diff.localOnly.push(localItem);
      } else if (localItem.leaderName !== notionItem.leaderName) {
        diff.conflicts.push({
          date: localItem.date,
          bookName: localItem.bookName,
          local: localItem,
          notion: notionItem
        });
      }
    });
    
    // 检查Notion独有的排期
    notionSchedule.forEach(notionItem => {
      const localItem = localData.schedule.find(item => 
        item.date === notionItem.date && item.bookName === notionItem.bookName
      );
      
      if (!localItem) {
        diff.notionOnly.push(notionItem);
      }
    });
    
    // 显示差异
    displayDiff(diff);
    
    // 显示操作选项
    await showOptions(diff);
    
  } catch (error) {
    console.error('检查排期差异失败:', error);
    rl.close();
  }
}

main(); 
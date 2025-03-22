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
 * 将本地排期同步到Notion
 * @param {Object} diff - 差异分析结果
 */
async function syncToNotion(diff) {
  console.log('\n开始同步到Notion...');
  
  if (diff.localOnly.length > 0) {
    console.log('\n需要添加到Notion的排期:');
    diff.localOnly.forEach(item => {
      console.log(`+ ${item.date} - ${item.bookName} (领读人: ${item.leaderName})`);
    });
    
    const answer = await question('\n是否继续同步这些排期到Notion？(y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('已取消添加操作');
      return;
    }
  }
  
  if (diff.conflicts.length > 0) {
    console.log('\n需要在Notion中更新的排期:');
    diff.conflicts.forEach(conflict => {
      console.log(`! ${conflict.date} - ${conflict.bookName}`);
      console.log(`  本地: 领读人 ${conflict.local.leaderName}`);
      console.log(`  Notion: 领读人 ${conflict.notion.leaderName}`);
    });
    
    const answer = await question('\n是否继续更新这些排期到Notion？(y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('已取消更新操作');
      return;
    }
  }
  
  if (diff.localOnly.length === 0 && diff.conflicts.length === 0) {
    console.log('没有需要同步到Notion的变更');
    return;
  }
  
  console.log('\n开始更新Notion数据库...');
  const manager = new BookScheduleManager();
  
  // 处理需要添加的排期
  if (diff.localOnly.length > 0) {
    console.log('\n正在添加新排期到Notion...');
    
    for (const item of diff.localOnly) {
      try {
        await manager.createOrUpdateNotionRecord(item);
        console.log(`✓ 成功添加: ${item.date} - ${item.bookName}`);
      } catch (error) {
        console.error(`× 添加失败: ${item.date} - ${item.bookName} (${error.message})`);
      }
    }
  }
  
  // 处理需要更新的排期
  if (diff.conflicts.length > 0) {
    console.log('\n正在更新Notion中的排期...');
    
    for (const conflict of diff.conflicts) {
      try {
        // 使用本地版本更新Notion
        await manager.createOrUpdateNotionRecord(conflict.local);
        console.log(`✓ 成功更新: ${conflict.date} - ${conflict.bookName}`);
      } catch (error) {
        console.error(`× 更新失败: ${conflict.date} - ${conflict.bookName} (${error.message})`);
      }
    }
  }
  
  console.log('\nNotion数据库更新完成！');
  
  // 自动同步回本地，以便于获取最新ID等信息
  console.log('\n正在重新获取Notion数据以更新本地数据...');
  try {
    const notionSchedule = await manager.fetchBookSchedule();
    // 保存到本地文件
    await manager.saveSchedule(notionSchedule);
    console.log('本地数据已更新');
  } catch (error) {
    console.error('更新本地数据失败:', error);
  }
}

/**
 * 从Notion更新本地排期
 * @param {Object} diff - 差异分析结果
 */
async function updateFromNotion(diff) {
  console.log('\n开始从Notion更新本地排期...');
  
  if (diff.localOnly.length > 0) {
    console.log('\n以下本地排期将被删除:');
    diff.localOnly.forEach(item => {
      console.log(`- ${item.date} - ${item.bookName} (领读人: ${item.leaderName})`);
    });
  }
  
  if (diff.notionOnly.length > 0) {
    console.log('\n以下Notion排期将被添加:');
    diff.notionOnly.forEach(item => {
      console.log(`+ ${item.date} - ${item.bookName} (领读人: ${item.leaderName})`);
    });
  }
  
  if (diff.conflicts.length > 0) {
    console.log('\n以下排期将被更新:');
    diff.conflicts.forEach(conflict => {
      console.log(`! ${conflict.date} - ${conflict.bookName}`);
      console.log(`  本地: 领读人 ${conflict.local.leaderName}`);
      console.log(`  Notion: 领读人 ${conflict.notion.leaderName}`);
    });
  }
  
  const answer = await question('\n是否继续更新？(y/n): ');
  if (answer.toLowerCase() !== 'y') {
    console.log('已取消更新');
    return;
  }
  
  const manager = new BookScheduleManager();
  try {
    // 从Notion获取最新数据
    const notionSchedule = await manager.fetchBookSchedule();
    // 保存到本地文件
    await manager.saveSchedule(notionSchedule);
    console.log('本地排期已更新');
  } catch (error) {
    console.error('更新失败:', error);
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
      await syncToNotion(diff);
      break;
      
    case '2':
      await updateFromNotion(diff);
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
    
    // 获取 Notion 数据库结构
    const manager = new BookScheduleManager();
    console.log('获取Notion数据库结构...');
    const dbStructure = await manager.notion.databases.retrieve({
      database_id: manager.bookListDatabaseId
    });
    
    console.log('\n数据库属性:');
    Object.entries(dbStructure.properties).forEach(([key, value]) => {
      console.log(`- ${key} (${value.type})`);
      
      // 如果是status类型，显示所有可用的选项
      if (value.type === 'status') {
        console.log('  可用状态选项:');
        value.status.options.forEach(option => {
          console.log(`  - ${option.name} (${option.color})`);
        });
      } else if (value.type === 'select') {
        console.log('  可用选择选项:');
        value.select.options.forEach(option => {
          console.log(`  - ${option.name} (${option.color})`);
        });
      } else if (value.type === 'multi_select') {
        console.log('  可用多选选项:');
        value.multi_select.options.forEach(option => {
          console.log(`  - ${option.name} (${option.color})`);
        });
      }
    });
    
    // 检查是否有名为"模板"的属性
    if (!dbStructure.properties["模板"] && !dbStructure.properties["类型"]) {
      console.log('\n尝试查询数据库中是否存在模板记录...');
      
      // 查询几条记录，看看是否有特定的属性
      const sampleRecords = await manager.notion.databases.query({
        database_id: manager.bookListDatabaseId,
        page_size: 5
      });
      
      if (sampleRecords.results.length > 0) {
        console.log(`找到 ${sampleRecords.results.length} 条记录，检查属性...`);
        const samplePage = sampleRecords.results[0];
        console.log('示例记录属性:');
        Object.entries(samplePage.properties).forEach(([key, value]) => {
          let valueStr = '';
          try {
            if (value.type === 'title') {
              valueStr = value.title[0]?.plain_text || '';
            } else if (value.type === 'rich_text') {
              valueStr = value.rich_text[0]?.plain_text || '';
            } else if (value.type === 'status') {
              valueStr = value.status?.name || '';
            } else if (value.type === 'select') {
              valueStr = value.select?.name || '';
            }
          } catch (e) {
            valueStr = '无法解析';
          }
          console.log(`  - ${key}: ${value.type} = ${valueStr}`);
        });
      }
    }
    
    // 读取Notion排期
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
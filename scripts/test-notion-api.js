/**
 * @fileoverview Notion API功能测试入口脚本
 * 提供统一的测试界面，可测试模板创建、排期更新等功能
 */

const BookScheduleManager = require('../src/book-schedule-manager');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 日期和时间格式化辅助函数
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 生成测试数据的函数
function createTestData() {
  const now = new Date();
  // 生成下一个月的日期作为测试日期
  now.setMonth(now.getMonth() + 1);
  
  return {
    date: formatDate(now),
    bookName: `测试书籍-${Math.floor(Math.random() * 1000)}`,
    leaderName: "测试领读人",
    hostName: "测试主持人"
  };
}

/**
 * 测试创建读书计划模板功能
 */
async function testTemplateCreation() {
  try {
    console.log('\n开始测试创建"读书计划"模板功能...');
    
    // 创建测试数据
    const testSchedule = createTestData();
    console.log('正在创建完整的"读书计划"记录...');
    console.log(`测试数据: ${testSchedule.date} - ${testSchedule.bookName}`);
    
    // 创建管理器实例
    const manager = new BookScheduleManager();
    
    // 调用创建方法
    const page = await manager.createNotionRecord(testSchedule);
    
    console.log('创建成功！');
    console.log(`页面ID: ${page.id}`);
    console.log(`页面URL: https://www.notion.so/${page.id.replace(/-/g, '')}`);
    
    // 返回创建的页面信息，以便其他测试使用
    return {
      pageId: page.id,
      schedule: testSchedule
    };
  } catch (error) {
    console.error('测试失败:', error);
    if (error.code) {
      console.error(`错误代码: ${error.code}`);
    }
    if (error.body) {
      try {
        const errorBody = JSON.parse(error.body);
        console.error(`错误详情: ${JSON.stringify(errorBody, null, 2)}`);
      } catch (e) {
        console.error(`错误详情: ${error.body}`);
      }
    }
    return null;
  }
}

/**
 * 测试更新排期功能
 * @param {Object} createdData - 已创建的测试数据 (可选)
 */
async function testUpdateSchedule(createdData = null) {
  try {
    console.log('\n开始测试更新排期功能...');
    
    // 创建管理器实例
    const manager = new BookScheduleManager();
    
    let testSchedule, existingPage;
    
    if (createdData) {
      // 使用已创建的测试数据
      testSchedule = {
        ...createdData.schedule,
        leaderName: `更新后的领读人-${Math.floor(Math.random() * 100)}`,
        hostName: `更新后的主持人-${Math.floor(Math.random() * 100)}`
      };
      existingPage = { id: createdData.pageId };
      console.log(`使用已创建的记录进行测试，ID: ${existingPage.id}`);
    } else {
      // 创建测试数据
      testSchedule = createTestData();
      
      // 查找现有记录
      console.log(`正在查找排期: ${testSchedule.date} - ${testSchedule.bookName}`);
      existingPage = await manager.findNotionPage(testSchedule.date, testSchedule.bookName);
      
      if (!existingPage) {
        console.log('没有找到匹配的记录，请先创建测试记录');
        return null;
      }
      
      console.log(`找到现有记录，ID: ${existingPage.id}`);
    }
    
    console.log('开始更新排期信息...');
    console.log(`将领读人更新为: ${testSchedule.leaderName}`);
    console.log(`将主持人更新为: ${testSchedule.hostName}`);
    
    // 调用更新方法
    const result = await manager.updateNotionPage(existingPage.id, testSchedule);
    
    console.log('更新成功！');
    console.log(`页面ID: ${result.id}`);
    console.log(`页面URL: https://www.notion.so/${result.id.replace(/-/g, '')}`);
    
    return {
      pageId: result.id,
      schedule: testSchedule
    };
  } catch (error) {
    console.error('测试失败:', error);
    if (error.code) {
      console.error(`错误代码: ${error.code}`);
    }
    if (error.body) {
      try {
        const errorBody = JSON.parse(error.body);
        console.error(`错误详情: ${JSON.stringify(errorBody, null, 2)}`);
      } catch (e) {
        console.error(`错误详情: ${error.body}`);
      }
    }
    return null;
  }
}

/**
 * 删除测试记录
 * @param {Object} testData - 测试数据
 */
async function deleteTestRecord(testData) {
  if (!testData || !testData.pageId) {
    console.log('没有有效的测试数据，无法删除');
    return;
  }
  
  try {
    console.log('\n开始删除测试记录...');
    console.log(`页面ID: ${testData.pageId}`);
    
    const manager = new BookScheduleManager();
    
    // 使用Notion API删除页面
    await manager.notion.pages.update({
      page_id: testData.pageId,
      archived: true
    });
    
    console.log('测试记录已归档/删除');
  } catch (error) {
    console.error('删除测试记录失败:', error.message);
  }
}

/**
 * 显示测试菜单并处理用户选择
 */
function showTestMenu() {
  console.log('\n=== Notion API 功能测试 ===');
  console.log('1. 测试创建"读书计划"模板');
  console.log('2. 测试更新排期功能');
  console.log('3. 完整测试流程 (创建->更新->删除)');
  console.log('4. 退出');
  
  rl.question('\n请选择要测试的功能 (1-4): ', async (answer) => {
    let testData = null;
    
    switch (answer.trim()) {
      case '1':
        testData = await testTemplateCreation();
        if (testData) {
          rl.question('\n是否删除测试记录? (y/n): ', async (shouldDelete) => {
            if (shouldDelete.toLowerCase() === 'y') {
              await deleteTestRecord(testData);
            }
            showTestMenu();
          });
        } else {
          showTestMenu();
        }
        break;
        
      case '2':
        testData = await testUpdateSchedule();
        showTestMenu();
        break;
        
      case '3':
        console.log('\n开始完整测试流程...');
        // 创建记录
        testData = await testTemplateCreation();
        
        if (testData) {
          // 更新记录
          testData = await testUpdateSchedule(testData);
          
          if (testData) {
            // 删除记录
            rl.question('\n是否删除测试记录? (y/n): ', async (shouldDelete) => {
              if (shouldDelete.toLowerCase() === 'y') {
                await deleteTestRecord(testData);
              }
              showTestMenu();
            });
          } else {
            showTestMenu();
          }
        } else {
          showTestMenu();
        }
        break;
        
      case '4':
        console.log('退出测试');
        rl.close();
        break;
        
      default:
        console.log('无效的选项，请重新选择');
        showTestMenu();
        break;
    }
  });
}

// 加载环境变量
require('dotenv').config();

// 检查重要的环境变量
console.log('环境变量检查:');
console.log('- NOTION_API_KEY:', process.env.NOTION_API_KEY ? '已设置' : '未设置');
console.log('- NOTION_BOOKLIST_DATABASE_ID:', process.env.NOTION_BOOKLIST_DATABASE_ID ? '已设置' : '未设置');
console.log('- TEST_MODE:', process.env.TEST_MODE);

// 尝试初始化Notion客户端
async function testNotionConnection() {
  try {
    const { Client } = require('@notionhq/client');
    console.log('\n正在初始化Notion客户端...');
    
    const notion = new Client({ 
      auth: process.env.NOTION_API_KEY,
      logLevel: 'debug'
    });
    
    console.log('Notion客户端已初始化');
    
    try {
      console.log(`\n正在尝试查询数据库 (${process.env.NOTION_BOOKLIST_DATABASE_ID})...`);
      const response = await notion.databases.retrieve({
        database_id: process.env.NOTION_BOOKLIST_DATABASE_ID
      });
      
      console.log('✅ 数据库查询成功!');
      console.log('数据库标题:', response.title[0]?.plain_text || '无标题');
      console.log('包含的属性:', Object.keys(response.properties).join(', '));
      
      // 尝试查询一些实际数据
      console.log('\n正在查询数据库中的记录...');
      const results = await notion.databases.query({
        database_id: process.env.NOTION_BOOKLIST_DATABASE_ID,
        page_size: 5
      });
      
      console.log(`✅ 查询成功! 获取到 ${results.results.length} 条记录`);
      
      if (results.results.length > 0) {
        console.log('\n第一条记录预览:');
        const firstPage = results.results[0];
        const properties = firstPage.properties;
        
        // 打印第一条记录的属性
        Object.keys(properties).forEach(key => {
          const prop = properties[key];
          let value = '无法读取';
          
          // 根据不同的属性类型获取值
          if (prop.type === 'title' && prop.title[0]) {
            value = prop.title[0].plain_text;
          } else if (prop.type === 'rich_text' && prop.rich_text[0]) {
            value = prop.rich_text[0].plain_text;
          } else if (prop.type === 'date' && prop.date) {
            value = prop.date.start;
          } else if (prop.type === 'select' && prop.select) {
            value = prop.select.name;
          }
          
          console.log(`- ${key}: ${value}`);
        });
      }
      
    } catch (dbError) {
      console.error('❌ 数据库查询失败:', dbError.message);
      if (dbError.code) {
        console.error('错误代码:', dbError.code);
      }
      console.error('\n请检查您的数据库ID是否正确，以及API密钥是否有权限访问该数据库');
    }
    
  } catch (error) {
    console.error('❌ Notion客户端初始化失败:', error.message);
    console.error('\n请检查您的API密钥是否正确');
  }
}

testNotionConnection();

// 启动测试菜单
showTestMenu(); 
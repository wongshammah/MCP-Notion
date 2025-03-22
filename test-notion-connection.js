/**
 * @fileoverview Notion连接测试工具
 * 用于测试Notion API连接并获取邀请函模板
 * 从归档数据库中检索最近的邀请函内容
 */

const { Client } = require('@notionhq/client');
const config = require('./src/config-loader');

/**
 * 初始化Notion客户端
 * @type {Client}
 * @description 使用API令牌创建Notion客户端实例
 * 从环境变量中加载API令牌
 */
const notion = new Client(config.getNotionConfig());

/**
 * 获取邀请函模板
 * @async
 * @function getInvitationTemplates
 * @description 从Notion数据库中获取邀请函模板：
 * 1. 搜索所有归档数据库
 * 2. 获取最近的三个归档
 * 3. 从每个归档中提取邀请函内容
 * @throws {Error} 当API调用失败时抛出错误
 */
async function getInvitationTemplates() {
  try {
    // 搜索所有归档数据库
    const databases = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      },
      query: '归档'
    });

    // 获取最近的三个归档数据库
    const recentArchives = databases.results.slice(0, 3);
    
    console.log('\n最近的三个归档数据库:');
    for (const db of recentArchives) {
      console.log('\n数据库:', db.title[0]?.plain_text);
      console.log('ID:', db.id);
      
      // 查询每个数据库中的邀请函
      const items = await notion.databases.query({
        database_id: db.id,
        filter: {
          property: "Name",
          title: {
            contains: "邀请函"
          }
        }
      });

      if (items.results.length > 0) {
        for (const item of items.results) {
          console.log('\n--- 邀请函内容 ---');
          // 获取页面内容
          const blocks = await notion.blocks.children.list({
            block_id: item.id
          });
          
          console.log('标题:', item.properties.Name.title[0]?.plain_text);
          console.log('内容:');
          for (const block of blocks.results) {
            if (block.type === 'paragraph') {
              const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
              if (text) console.log(text);
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('获取邀请函模板失败:', error.message);
  }
}

// 执行测试
getInvitationTemplates(); 
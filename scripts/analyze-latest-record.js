/**
 * @fileoverview 获取并分析 Notion 数据库中最新的一条记录
 * 用于分析记录的完整结构和子内容信息
 */

const { Client } = require('@notionhq/client');
const config = require('../src/config-loader');

async function analyzeLatestRecord() {
  try {
    console.log('正在连接 Notion 数据库...');
    const notion = new Client({ auth: config.notion.apiKey });
    const databaseId = config.databases.booklist.id;
    
    console.log(`数据库ID: ${databaseId}`);
    
    // 1. 获取数据库中最新的一条记录
    console.log('正在获取最新记录...');
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending'
        }
      ],
      page_size: 1
    });
    
    if (response.results.length === 0) {
      console.log('未找到任何记录');
      return;
    }
    
    const latestRecord = response.results[0];
    console.log(`\n找到最新记录: ID ${latestRecord.id}`);
    console.log(`创建时间: ${new Date(latestRecord.created_time).toLocaleString()}`);
    console.log(`最后编辑时间: ${new Date(latestRecord.last_edited_time).toLocaleString()}`);
    
    // 2. 分析记录的属性
    console.log('\n=== 记录属性分析 ===');
    const properties = latestRecord.properties;
    console.log('属性列表:');
    
    for (const [key, value] of Object.entries(properties)) {
      let displayValue = '无值';
      
      try {
        if (value.type === 'title') {
          displayValue = value.title.map(t => t.plain_text).join('') || '空标题';
        } else if (value.type === 'rich_text') {
          displayValue = value.rich_text.map(t => t.plain_text).join('') || '空文本';
        } else if (value.type === 'select') {
          displayValue = value.select ? value.select.name : '未选择';
        } else if (value.type === 'multi_select') {
          displayValue = value.multi_select.map(item => item.name).join(', ') || '未选择';
        } else if (value.type === 'date') {
          displayValue = value.date ? `${value.date.start}${value.date.end ? ' → ' + value.date.end : ''}` : '未设置日期';
        } else if (value.type === 'status') {
          displayValue = value.status ? value.status.name : '未设置状态';
        } else if (value.type === 'checkbox') {
          displayValue = value.checkbox ? '已勾选' : '未勾选';
        } else if (value.type === 'url') {
          displayValue = value.url || '无URL';
        } else if (value.type === 'email') {
          displayValue = value.email || '无邮箱';
        } else if (value.type === 'phone_number') {
          displayValue = value.phone_number || '无电话';
        } else if (value.type === 'number') {
          displayValue = value.number !== null ? value.number.toString() : '无数字';
        } else if (value.type === 'relation') {
          displayValue = `关联了 ${value.relation.length} 个项目`;
        } else {
          displayValue = `[${value.type}类型]`;
        }
      } catch (error) {
        displayValue = `解析错误: ${error.message}`;
      }
      
      console.log(`- ${key} (${value.type}): ${displayValue}`);
    }
    
    // 3. 获取页面详细内容
    console.log('\n=== 页面内容分析 ===');
    
    const pageContent = await notion.blocks.children.list({
      block_id: latestRecord.id
    });
    
    if (pageContent.results.length === 0) {
      console.log('页面没有内容块');
    } else {
      console.log(`页面包含 ${pageContent.results.length} 个内容块:`);
      
      for (let i = 0; i < pageContent.results.length; i++) {
        const block = pageContent.results[i];
        console.log(`\n内容块 #${i+1} (${block.type}):`);
        
        if (block.type === 'paragraph') {
          const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
          console.log(`  段落文本: ${text || '空段落'}`);
        } else if (block.type === 'heading_1') {
          const text = block.heading_1.rich_text.map(t => t.plain_text).join('');
          console.log(`  一级标题: ${text || '空标题'}`);
        } else if (block.type === 'heading_2') {
          const text = block.heading_2.rich_text.map(t => t.plain_text).join('');
          console.log(`  二级标题: ${text || '空标题'}`);
        } else if (block.type === 'heading_3') {
          const text = block.heading_3.rich_text.map(t => t.plain_text).join('');
          console.log(`  三级标题: ${text || '空标题'}`);
        } else if (block.type === 'bulleted_list_item') {
          const text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
          console.log(`  无序列表项: ${text || '空列表项'}`);
        } else if (block.type === 'numbered_list_item') {
          const text = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
          console.log(`  有序列表项: ${text || '空列表项'}`);
        } else if (block.type === 'to_do') {
          const text = block.to_do.rich_text.map(t => t.plain_text).join('');
          const checked = block.to_do.checked ? '已完成' : '未完成';
          console.log(`  待办事项: ${text || '空待办项'} (${checked})`);
        } else if (block.type === 'toggle') {
          const text = block.toggle.rich_text.map(t => t.plain_text).join('');
          console.log(`  折叠块: ${text || '空折叠块'}`);
          console.log(`  注: 折叠块可能包含子内容，需要额外请求`);
        } else if (block.type === 'child_page') {
          console.log(`  子页面: ${block.child_page.title || '无标题子页面'}`);
        } else if (block.type === 'image') {
          const imageType = block.image.type;
          const imageUrl = imageType === 'external' ? block.image.external.url : block.image.file.url;
          console.log(`  图片: ${imageUrl}`);
        } else if (block.type === 'code') {
          const code = block.code.rich_text.map(t => t.plain_text).join('');
          const language = block.code.language;
          console.log(`  代码块 (${language}): ${code.length > 50 ? code.substring(0, 50) + '...' : code}`);
        } else if (block.type === 'quote') {
          const text = block.quote.rich_text.map(t => t.plain_text).join('');
          console.log(`  引用块: ${text || '空引用'}`);
        } else if (block.type === 'divider') {
          console.log(`  分割线`);
        } else if (block.type === 'callout') {
          const text = block.callout.rich_text.map(t => t.plain_text).join('');
          const icon = block.callout.icon?.emoji || '无图标';
          console.log(`  标注 (${icon}): ${text || '空标注'}`);
        } else if (block.type === 'child_database') {
          console.log(`  子数据库ID: ${block.id}`);
          console.log(`  注意: 此块是子数据库，将进行详细分析`);
        } else {
          console.log(`  其他类型块: ${block.type}`);
          console.log(`  原始数据: ${JSON.stringify(block).slice(0, 100)}...`);
        }
        
        // 检查是否有子块
        if (block.has_children) {
          console.log(`  注意: 此块包含子内容，需要额外请求子块内容`);
        }
      }
    }
    
    // 4. 分析子数据库
    console.log('\n=== 子数据库分析 ===');
    
    // 查找子数据库块
    const childDatabaseBlock = pageContent.results.find(block => block.type === 'child_database');
    
    if (!childDatabaseBlock) {
      console.log('未找到子数据库');
    } else {
      const childDatabaseId = childDatabaseBlock.id;
      console.log(`找到子数据库，ID: ${childDatabaseId}`);
      
      // 4.1 获取子数据库的结构
      try {
        console.log('\n子数据库结构:');
        const databaseStructure = await notion.databases.retrieve({
          database_id: childDatabaseId
        });
        
        console.log(`标题: ${databaseStructure.title.map(t => t.plain_text).join('') || '无标题'}`);
        console.log(`URL: ${databaseStructure.url}`);
        console.log(`创建时间: ${new Date(databaseStructure.created_time).toLocaleString()}`);
        console.log(`最后编辑时间: ${new Date(databaseStructure.last_edited_time).toLocaleString()}`);
        
        console.log('\n子数据库属性:');
        Object.entries(databaseStructure.properties).forEach(([key, value]) => {
          console.log(`- ${key} (${value.type})`);
          
          // 如果是status、select或multi_select类型，显示所有可用的选项
          if (value.type === 'status' && value.status && value.status.options) {
            console.log('  可用状态选项:');
            value.status.options.forEach(option => {
              console.log(`  - ${option.name} (${option.color})`);
            });
          } else if (value.type === 'select' && value.select && value.select.options) {
            console.log('  可用选择选项:');
            value.select.options.forEach(option => {
              console.log(`  - ${option.name} (${option.color})`);
            });
          } else if (value.type === 'multi_select' && value.multi_select && value.multi_select.options) {
            console.log('  可用多选选项:');
            value.multi_select.options.forEach(option => {
              console.log(`  - ${option.name} (${option.color})`);
            });
          }
        });
      } catch (error) {
        console.error(`获取子数据库结构失败: ${error.message}`);
      }
      
      // 4.2 获取子数据库中的记录
      try {
        console.log('\n子数据库记录:');
        const databaseRecords = await notion.databases.query({
          database_id: childDatabaseId,
          page_size: 5 // 限制返回5条，避免数据过多
        });
        
        if (databaseRecords.results.length === 0) {
          console.log('子数据库没有记录');
        } else {
          console.log(`子数据库包含 ${databaseRecords.results.length} 条记录 (显示前5条):`);
          
          for (let i = 0; i < databaseRecords.results.length; i++) {
            const record = databaseRecords.results[i];
            console.log(`\n记录 #${i+1} (ID: ${record.id}):`);
            
            // 显示记录属性
            for (const [key, value] of Object.entries(record.properties)) {
              let displayValue = '无值';
              
              try {
                if (value.type === 'title') {
                  displayValue = value.title.map(t => t.plain_text).join('') || '空标题';
                } else if (value.type === 'rich_text') {
                  displayValue = value.rich_text.map(t => t.plain_text).join('') || '空文本';
                } else if (value.type === 'select') {
                  displayValue = value.select ? value.select.name : '未选择';
                } else if (value.type === 'multi_select') {
                  displayValue = value.multi_select.map(item => item.name).join(', ') || '未选择';
                } else if (value.type === 'date') {
                  displayValue = value.date ? `${value.date.start}${value.date.end ? ' → ' + value.date.end : ''}` : '未设置日期';
                } else if (value.type === 'status') {
                  displayValue = value.status ? value.status.name : '未设置状态';
                } else if (value.type === 'checkbox') {
                  displayValue = value.checkbox ? '已勾选' : '未勾选';
                } else if (value.type === 'url') {
                  displayValue = value.url || '无URL';
                } else if (value.type === 'email') {
                  displayValue = value.email || '无邮箱';
                } else if (value.type === 'phone_number') {
                  displayValue = value.phone_number || '无电话';
                } else if (value.type === 'number') {
                  displayValue = value.number !== null ? value.number.toString() : '无数字';
                } else if (value.type === 'relation') {
                  displayValue = `关联了 ${value.relation.length} 个项目`;
                } else {
                  displayValue = `[${value.type}类型]`;
                }
              } catch (error) {
                displayValue = `解析错误: ${error.message}`;
              }
              
              console.log(`  - ${key} (${value.type}): ${displayValue}`);
            }
          }
        }
      } catch (error) {
        console.error(`获取子数据库记录失败: ${error.message}`);
      }
    }
    
    // 5. 分析页面的元数据
    console.log('\n=== 页面元数据 ===');
    console.log(`URL: ${latestRecord.url}`);
    console.log(`对象类型: ${latestRecord.object}`);
    console.log(`父级类型: ${latestRecord.parent.type}`);
    console.log(`父级ID: ${latestRecord.parent.database_id}`);
    
    if (latestRecord.cover) {
      const coverType = latestRecord.cover.type;
      const coverUrl = coverType === 'external' ? latestRecord.cover.external.url : latestRecord.cover.file.url;
      console.log(`封面图片: ${coverUrl}`);
    } else {
      console.log('无封面图片');
    }
    
    if (latestRecord.icon) {
      const iconType = latestRecord.icon.type;
      const iconData = iconType === 'emoji' ? latestRecord.icon.emoji : (iconType === 'external' ? latestRecord.icon.external.url : latestRecord.icon.file.url);
      console.log(`图标: ${iconType} - ${iconData}`);
    } else {
      console.log('无图标');
    }
    
    console.log('\n分析完成，等待进一步指令...');
    
  } catch (error) {
    console.error('分析失败:', error);
    if (error.code) {
      console.error(`错误代码: ${error.code}`);
      console.error(`错误消息: ${error.message}`);
    }
  }
}

// 执行分析
analyzeLatestRecord(); 
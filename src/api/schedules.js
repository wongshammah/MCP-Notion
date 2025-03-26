const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const SCHEDULE_FILE_PATH = path.join(__dirname, '../../config/book-schedule.json');

// 仅在非测试模式下初始化Notion客户端
let notion = null;
if (!global.TEST_MODE) {
  try {
    const { Client } = require('@notionhq/client');
    notion = new Client({ auth: process.env.NOTION_API_KEY });
    console.log('Notion客户端初始化成功');
  } catch (error) {
    console.error('Notion客户端初始化失败:', error.message);
  }
}

const NOTION_DATABASE_ID = process.env.NOTION_BOOKLIST_DATABASE_ID;

// 读取book-schedule.json文件
async function readScheduleFile() {
  try {
    const data = await fs.readFile(SCHEDULE_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取book-schedule.json失败:', error);
    return { schedule: [], lastUpdated: new Date().toISOString() };
  }
}

// 写入book-schedule.json文件
async function writeScheduleFile(data) {
  try {
    await fs.writeFile(SCHEDULE_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('写入book-schedule.json失败:', error);
    throw error;
  }
}

// 获取所有排期
router.get('/', async (req, res) => {
  try {
    // 首先尝试从本地文件读取
    const localData = await readScheduleFile();
    
    // 如果在测试模式或Notion API配置错误，只返回本地数据
    if (global.TEST_MODE || !notion) {
      return res.json(localData);
    }
    
    // 否则尝试从Notion同步
    try {
      const notionPages = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        sorts: [{ property: "排期", direction: "descending" }]
      });
      
      // 转换Notion数据为本地格式
      const notionData = {
        schedule: notionPages.results.map(page => ({
          date: page.properties["排期"]?.date?.start,
          bookName: page.properties["书名"]?.title[0]?.text?.content || '未指定',
          leaderName: page.properties["领读人"]?.rich_text[0]?.text?.content || '未指定',
          hostName: page.properties["主持人"]?.rich_text[0]?.text?.content || '未指定'
        })).filter(item => item.date),
        lastUpdated: new Date().toISOString()
      };
      
      // 合并本地数据和Notion数据
      const mergedData = {
        schedule: [...localData.schedule, ...notionData.schedule].filter((v, i, a) => 
          a.findIndex(t => t.date === v.date) === i
        ).sort((a, b) => new Date(b.date) - new Date(a.date)),
        lastUpdated: new Date().toISOString()
      };
      
      // 保存合并后的数据到本地
      await writeScheduleFile(mergedData);
      
      return res.json(mergedData);
    } catch (notionError) {
      console.error('Notion API错误：', notionError);
      // 如果Notion API失败，返回本地数据
      return res.json(localData);
    }
  } catch (error) {
    console.error('获取排期失败:', error);
    res.status(500).json({ error: '获取排期失败' });
  }
});

// 添加新排期
router.post('/', async (req, res) => {
  try {
    const newSchedule = req.body;
    const data = await readScheduleFile();
    
    // 检查日期是否已存在
    const existingSchedule = data.schedule.find(s => s.date === newSchedule.date);
    if (existingSchedule) {
      return res.status(400).json({ error: '该日期已有排期' });
    }

    // 添加新排期并按日期排序
    data.schedule.push(newSchedule);
    data.schedule.sort((a, b) => new Date(b.date) - new Date(a.date));
    data.lastUpdated = new Date().toISOString();

    await writeScheduleFile(data);
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ error: '添加排期失败' });
  }
});

// 更新排期信息
router.put('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const updatedSchedule = req.body;
    const data = await readScheduleFile();

    // 查找并更新排期
    const index = data.schedule.findIndex(s => s.date === date);
    if (index === -1) {
      return res.status(404).json({ error: '未找到该排期' });
    }

    data.schedule[index] = updatedSchedule;
    data.lastUpdated = new Date().toISOString();

    await writeScheduleFile(data);
    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ error: '更新排期失败' });
  }
});

// 删除排期
router.delete('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const data = await readScheduleFile();

    // 查找并删除排期
    const index = data.schedule.findIndex(s => s.date === date);
    if (index === -1) {
      return res.status(404).json({ error: '未找到该排期' });
    }

    data.schedule.splice(index, 1);
    data.lastUpdated = new Date().toISOString();

    await writeScheduleFile(data);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '删除排期失败' });
  }
});

// 同步到Notion
router.post('/sync', async (req, res) => {
  // 如果在测试模式，返回提示消息
  if (global.TEST_MODE || !notion) {
    return res.status(400).json({ 
      error: '系统在测试模式运行，Notion同步功能不可用',
      message: '请设置正确的NOTION_API_KEY和NOTION_BOOKLIST_DATABASE_ID环境变量'
    });
  }
  
  try {
    const data = await readScheduleFile();
    
    // 获取Notion中的现有数据
    const notionPages = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      sorts: [
        {
          property: "排期",
          direction: "descending"
        }
      ]
    });

    // 更新或创建页面
    const results = [];
    for (const schedule of data.schedule) {
      const existingPage = notionPages.results.find(
        page => page.properties["排期"]?.date?.start === schedule.date
      );

      const pageProperties = {
        "书名": {
          title: [{ text: { content: schedule.bookName } }]
        },
        "排期": {
          date: { start: schedule.date }
        },
        "领读人": {
          rich_text: [{ text: { content: schedule.leaderName } }]
        },
        "主持人": {
          rich_text: [{ text: { content: schedule.hostName } }]
        }
      };

      try {
        if (existingPage) {
          // 更新现有页面
          const updatedPage = await notion.pages.update({
            page_id: existingPage.id,
            properties: pageProperties
          });
          results.push({ id: updatedPage.id, date: schedule.date, status: 'updated' });
        } else {
          // 创建新页面
          const newPage = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: pageProperties
          });
          results.push({ id: newPage.id, date: schedule.date, status: 'created' });
        }
      } catch (error) {
        results.push({ date: schedule.date, status: 'error', message: error.message });
      }
    }

    res.json({ 
      message: '同步成功', 
      results, 
      totalUpdated: results.filter(r => r.status === 'updated').length, 
      totalCreated: results.filter(r => r.status === 'created').length,
      totalErrors: results.filter(r => r.status === 'error').length
    });
  } catch (error) {
    console.error('同步到Notion失败:', error);
    res.status(500).json({ error: '同步到Notion失败: ' + error.message });
  }
});

module.exports = router; 
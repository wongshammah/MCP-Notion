/**
 * @fileoverview 读书会排期管理器
 * 用于管理和更新读书会排期信息
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const config = require('./config-loader');

class BookScheduleManager {
  /**
   * 创建排期管理器实例
   * @param {string} [token] - Notion API令牌，如果不提供则从配置中读取
   */
  constructor(token) {
    // 如果提供了token，使用它；否则从配置中读取
    this.notion = new Client({ auth: token || config.notion.apiKey });
    this.schedulePath = path.join(__dirname, '../config/book-schedule.json');
  }

  /**
   * 获取数据库结构
   * @param {string} databaseId - 数据库ID
   * @returns {Promise<Object>} 数据库结构信息
   */
  async getDatabaseStructure(databaseId) {
    try {
      const response = await this.notion.databases.retrieve({
        database_id: databaseId
      });
      
      console.log('\n数据库属性:');
      Object.entries(response.properties).forEach(([key, value]) => {
        console.log(`- ${key} (${value.type})`);
      });
      
      return response.properties;
    } catch (error) {
      console.error('获取数据库结构失败:', error.message);
      return null;
    }
  }

  /**
   * 从Notion数据库获取书单历史数据
   * @param {string} [databaseId] - 书单数据库ID，如果不提供则从配置中读取
   * @returns {Promise<Array>} 排期列表
   */
  async fetchBookSchedule(databaseId) {
    try {
      // 如果没有提供databaseId，从配置中获取
      const dbId = databaseId || config.getDatabaseId('booklist');
      console.log(`正在获取历史书单数据...`);
      console.log(`数据库: ${config.databases.booklist.name} (${dbId})`);
      
      // 先获取数据库结构
      const structure = await this.getDatabaseStructure(dbId);
      if (!structure) {
        throw new Error('无法获取数据库结构');
      }

      // 查询数据库内容，按时间从近到远排序
      const response = await this.notion.databases.query({
        database_id: dbId,
        sorts: [
          {
            property: '排期',
            direction: 'descending'  // 降序排序
          }
        ]
      });

      console.log(`\n找到 ${response.results.length} 条记录`);

      const schedules = response.results.map(page => {
        const bookName = page.properties['书名']?.title[0]?.plain_text;
        const leaderName = page.properties['领读人']?.rich_text[0]?.plain_text;
        const date = page.properties['排期']?.date?.start;
        
        // 从书名中提取期数（如果有）
        let period = null;
        if (bookName) {
          const match = bookName.match(/第(\d+)期/);
          if (match) {
            period = parseInt(match[1]);
          }
        }

        // 打印每条记录的详细信息
        console.log('\n记录详情:');
        console.log('- 书名:', bookName);
        console.log('- 领读人:', leaderName);
        console.log('- 日期:', date);
        console.log('- 提取的期数:', period);

        return {
          period,
          date,
          bookName,
          leaderName
        };
      });

      // 过滤有效记录
      const validSchedules = schedules.filter(item => {
        const isValid = item.bookName && item.date; // 放宽限制，只要求有书名和日期
        if (!isValid) {
          console.log('\n无效记录:', item);
        }
        return isValid;
      });

      console.log(`\n找到 ${validSchedules.length} 条有效记录`);
      return validSchedules;
    } catch (error) {
      console.error('获取书单失败:', error.message);
      return [];
    }
  }

  /**
   * 分析排期模式
   * @param {Array} schedules - 排期列表
   */
  analyzeSchedulePattern(schedules) {
    console.log('\n排期模式分析:');
    
    // 1. 分析时间间隔（按时间从早到晚的顺序计算）
    const sortedSchedules = [...schedules].sort((a, b) => new Date(a.date) - new Date(b.date));
    const intervals = [];
    for (let i = 1; i < sortedSchedules.length; i++) {
      const curr = new Date(sortedSchedules[i].date);
      const prev = new Date(sortedSchedules[i-1].date);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    console.log(`平均间隔天数: ${avgInterval.toFixed(1)}天`);
    
    // 2. 分析星期分布
    const weekdayCount = new Array(7).fill(0);
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    schedules.forEach(s => {
      const date = new Date(s.date);
      weekdayCount[date.getDay()]++;
    });
    
    console.log('\n星期分布:');
    weekdayCount.forEach((count, index) => {
      if (count > 0) {
        const percentage = ((count / schedules.length) * 100).toFixed(1);
        console.log(`${weekdayNames[index]}: ${count}次 (${percentage}%)`);
      }
    });
    
    // 3. 分析领读人分布
    const leaderCount = {};
    schedules.forEach(s => {
      if (s.leaderName) {
        leaderCount[s.leaderName] = (leaderCount[s.leaderName] || 0) + 1;
      }
    });
    
    console.log('\n领读人分布:');
    Object.entries(leaderCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([leader, count]) => {
        const percentage = ((count / schedules.length) * 100).toFixed(1);
        console.log(`${leader}: ${count}次 (${percentage}%)`);
      });
    
    // 4. 分析未来排期
    const now = new Date();
    const futureSchedules = schedules.filter(s => new Date(s.date) > now);
    console.log(`\n未来排期: ${futureSchedules.length}场`);
    console.log(`未指定领读人的场次: ${futureSchedules.filter(s => !s.leaderName).length}场`);
  }

  /**
   * 保存排期信息到本地文件
   * @param {Array} schedule - 排期列表
   */
  async saveSchedule(schedule) {
    try {
      const scheduleData = {
        lastUpdated: new Date().toISOString(),
        schedule: schedule.sort((a, b) => {
          // 总是按日期从近到远排序
          return new Date(b.date) - new Date(a.date);
        })
      };

      fs.writeFileSync(
        this.schedulePath,
        JSON.stringify(scheduleData, null, 2),
        'utf8'
      );

      console.log('排期信息已保存到:', this.schedulePath);
      
      // 分析排期模式
      this.analyzeSchedulePattern(schedule);
      
      // 打印排期信息预览（最近5场）
      console.log('\n排期信息预览（最近5场）:');
      schedule.slice(0, 5).forEach(item => {  // 改为从头开始取5条
        const periodText = item.period ? `第${item.period}期` : '未知期数';
        console.log(`${periodText}: ${item.date} - ${item.bookName} (领读人: ${item.leaderName || '待定'})`);
      });
    } catch (error) {
      console.error('保存排期信息失败:', error.message);
    }
  }

  /**
   * 获取最新的排期信息
   * @returns {Object|null} 最新的排期信息
   */
  getLatestSchedule() {
    try {
      if (fs.existsSync(this.schedulePath)) {
        const data = JSON.parse(fs.readFileSync(this.schedulePath, 'utf8'));
        // 根据日期排序，返回日期最近的排期（而不是数组最后一个元素）
        return data.schedule.length > 0 
          ? data.schedule.sort((a, b) => new Date(b.date) - new Date(a.date))[0] 
          : null;
      }
      return null;
    } catch (error) {
      console.error('读取排期信息失败:', error.message);
      return null;
    }
  }

  /**
   * 添加新的排期
   * @param {Object} schedule - 新的排期信息
   * @param {number} schedule.period - 期数
   * @param {string} schedule.date - 日期
   * @param {string} schedule.bookName - 书名
   * @param {string} schedule.leaderName - 领读人
   */
  async addSchedule(schedule) {
    try {
      const currentSchedule = fs.existsSync(this.schedulePath)
        ? JSON.parse(fs.readFileSync(this.schedulePath, 'utf8')).schedule
        : [];

      // 检查期数是否已存在（如果有期数）
      if (schedule.period && currentSchedule.some(s => s.period === schedule.period)) {
        throw new Error(`期数 ${schedule.period} 已存在`);
      }

      currentSchedule.push(schedule);
      await this.saveSchedule(currentSchedule);
    } catch (error) {
      console.error('添加排期失败:', error.message);
    }
  }
}

module.exports = BookScheduleManager; 
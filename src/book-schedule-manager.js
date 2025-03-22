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
    // 从配置中获取数据库ID
    this.bookListDatabaseId = config.databases.booklist.id;
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
      // 使用传入的databaseId或配置中的databaseId
      const targetDatabaseId = databaseId || this.bookListDatabaseId;
      
      if (!targetDatabaseId) {
        throw new Error('未提供数据库ID，请在配置文件中设置 NOTION_BOOKLIST_DATABASE_ID');
      }

      const response = await this.notion.databases.query({
        database_id: targetDatabaseId,
        sorts: [
          {
            property: "排期",
            direction: "descending"
          }
        ]
      });

      const schedule = response.results
        .map(page => {
          const properties = page.properties;
          const bookName = properties["书名"]?.title?.[0]?.plain_text || "";
          const date = properties["排期"]?.date?.start || "";
          const leaderName = properties["领读人"]?.rich_text?.[0]?.plain_text || "未指定";
          const hostName = properties["主持人"]?.rich_text?.[0]?.plain_text || "未指定";

          // 数据验证
          if (!bookName || !date) {
            console.warn(`警告：发现无效记录，缺少必要字段 - 书名: ${bookName}, 日期: ${date}`);
            return null;
          }

          // 验证日期格式
          if (!this.isValidDate(date)) {
            console.warn(`警告：发现无效日期格式 - ${date}`);
            return null;
          }

          return {
            date,
            bookName,
            leaderName,
            hostName
          };
        })
        .filter(record => record !== null);

      return schedule;
    } catch (error) {
      console.error("获取书单数据失败:", error);
      return [];
    }
  }

  // 添加日期验证方法
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // 添加数据验证方法
  validateScheduleData(schedule) {
    if (!Array.isArray(schedule)) {
      console.error("错误：排期数据必须是数组");
      return false;
    }

    const requiredFields = ["date", "bookName", "leaderName", "hostName"];
    
    for (const record of schedule) {
      // 检查必要字段
      for (const field of requiredFields) {
        if (!(field in record)) {
          console.error(`错误：记录缺少必要字段 ${field}`);
          return false;
        }
      }

      // 验证日期格式
      if (!this.isValidDate(record.date)) {
        console.error(`错误：无效的日期格式 - ${record.date}`);
        return false;
      }

      // 验证字段类型
      if (typeof record.bookName !== "string" || 
          typeof record.leaderName !== "string" || 
          typeof record.hostName !== "string") {
        console.error("错误：字段类型不正确");
        return false;
      }
    }

    return true;
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
      // 添加数据验证
      if (!this.validateScheduleData(schedule)) {
        throw new Error("数据验证失败");
      }

      const scheduleInfo = {
        lastUpdated: new Date().toISOString(),
        schedule
      };

      await fs.promises.writeFile(
        this.schedulePath,
        JSON.stringify(scheduleInfo, null, 2),
        "utf8"
      );
      console.log("排期信息已保存到本地文件");
      
      // 分析排期模式
      this.analyzeSchedulePattern(schedule);
      
      // 打印排期信息预览（最近5场）
      console.log('\n排期信息预览（最近5场）:');
      schedule.slice(0, 5).forEach(item => {  // 改为从头开始取5条
        const periodText = item.period ? `第${item.period}期` : '未知期数';
        console.log(`${periodText}: ${item.date} - ${item.bookName} (领读人: ${item.leaderName || '待定'})`);
      });
    } catch (error) {
      console.error("保存排期信息失败:", error);
      throw error;
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
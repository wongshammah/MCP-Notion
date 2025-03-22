/**
 * @fileoverview 获取历史书单数据脚本
 */

const BookScheduleManager = require('../src/book-schedule-manager');
const config = require('../src/config-loader');

async function fetchHistoricalSchedule() {
  try {
    // 创建排期管理器实例
    const manager = new BookScheduleManager();  // 不再传递token，将从配置中读取

    // fetchBookSchedule方法现在会自动从配置中获取数据库ID
    const schedule = await manager.fetchBookSchedule();

    if (schedule.length > 0) {
      console.log(`成功获取 ${schedule.length} 条排期记录`);
      await manager.saveSchedule(schedule);
    } else {
      console.log('未找到排期记录');
    }
  } catch (error) {
    console.error('获取历史书单失败:', error.message);
  }
}

// 执行脚本
fetchHistoricalSchedule(); 
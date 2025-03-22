/**
 * @fileoverview 配置加载器
 * 用于从环境变量和配置文件中加载和管理配置
 */

// 在生产环境中，dotenv可能已经在应用启动时加载
// 在开发环境中，我们在这里显式加载它
try {
  require('dotenv').config();
} catch (error) {
  console.warn('dotenv模块未安装，请确保环境变量已正确设置');
}

/**
 * 配置类，用于管理和提供应用程序配置
 */
class Config {
  /**
   * 初始化配置
   */
  constructor() {
    // Notion API配置
    this.notion = {
      apiKey: process.env.NOTION_API_KEY,
      pageId: process.env.NOTION_PAGE_ID
    };

    // 数据库配置
    this.databases = {
      booklist: {
        id: process.env.NOTION_BOOKLIST_DATABASE_ID,
        name: process.env.NOTION_BOOKLIST_NAME || '书单'
      }
    };

    // 服务器配置
    this.server = {
      port: parseInt(process.env.MCP_SERVER_PORT || '8080', 10)
    };

    // 文件路径配置
    this.paths = {
      invitationTemplate: './config/invitation.template.json',
      leaders: './config/leaders.json',
      bookSchedule: './config/book-schedule.json'
    };

    this.validate();
  }

  /**
   * 验证配置的有效性
   * @throws {Error} 当必需的配置缺失时抛出错误
   */
  validate() {
    const requiredEnvVars = [
      { name: 'NOTION_API_KEY', value: this.notion.apiKey },
      { name: 'NOTION_BOOKLIST_DATABASE_ID', value: this.databases.booklist.id }
    ];

    const missingVars = requiredEnvVars.filter(v => !v.value);
    if (missingVars.length > 0) {
      const missingVarNames = missingVars.map(v => v.name).join(', ');
      throw new Error(`缺少必需的环境变量: ${missingVarNames}`);
    }
  }

  /**
   * 获取Notion客户端配置
   * @returns {Object} Notion客户端配置
   */
  getNotionConfig() {
    return {
      auth: this.notion.apiKey
    };
  }

  /**
   * 获取数据库ID
   * @param {string} name - 数据库名称
   * @returns {string} 数据库ID
   * @throws {Error} 当数据库名称无效时抛出错误
   */
  getDatabaseId(name) {
    const database = this.databases[name];
    if (!database) {
      throw new Error(`未知的数据库名称: ${name}`);
    }
    return database.id;
  }
}

// 导出配置单例
module.exports = new Config(); 
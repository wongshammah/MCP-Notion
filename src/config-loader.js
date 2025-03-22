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
    this.validateConfig();
  }

  validateConfig() {
    // 检查环境变量
    const requiredEnvVars = [
      'NOTION_API_KEY',
      'NOTION_BOOKLIST_DATABASE_ID'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      throw new Error(`缺少必要的环境变量: ${missingEnvVars.join(', ')}`);
    }

    // 检查数据库配置
    if (!this.databases.booklist) {
      throw new Error('缺少书单数据库配置');
    }

    if (!this.databases.booklist.id) {
      throw new Error('缺少书单数据库ID');
    }

    if (!this.databases.booklist.name) {
      throw new Error('缺少书单数据库名称');
    }

    // 检查API密钥
    if (!this.notion.apiKey) {
      throw new Error('缺少Notion API密钥');
    }

    // 检查数据库ID格式
    if (!this.isValidUUID(this.databases.booklist.id)) {
      throw new Error('书单数据库ID格式无效');
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

  isValidUUID(uuid) {
    // Implement your UUID validation logic here
    return true; // Placeholder return, actual implementation needed
  }
}

// 导出配置单例
module.exports = new Config(); 
/**
 * @fileoverview Notion MCP (Message Control Protocol) 服务器
 * 提供与Notion API的WebSocket连接和实时数据交互功能
 * 支持页面获取和更新操作
 */

const { Client } = require('@notionhq/client');
const WebSocket = require('ws');
const config = require('./config-loader');

/**
 * Notion MCP服务器类
 * @class NotionMCPServer
 * @description 处理与Notion的实时数据交互，包括：
 * 1. 建立WebSocket连接
 * 2. 处理页面获取请求
 * 3. 处理页面更新请求
 * 4. 错误处理和消息响应
 */
class NotionMCPServer {
  /**
   * 创建Notion MCP服务器实例
   * @constructor
   * @param {Object} [options] - 服务器配置选项
   * @param {string} [options.token] - Notion API访问令牌，如不提供则从环境变量读取
   * @param {number} [options.port] - WebSocket服务器端口，如不提供则从环境变量读取
   */
  constructor(options = {}) {
    const token = options.token || config.notion.apiKey;
    const port = options.port || config.server.port;
    
    if (!token) {
      throw new Error('未提供Notion API访问令牌');
    }
    
    this.notion = new Client({ auth: token });
    this.wss = new WebSocket.Server({ port });
    
    console.log(`MCP服务器已启动，监听端口: ${port}`);
    this.setupWebSocket();
  }

  /**
   * 设置WebSocket服务器
   * @private
   * @description 处理客户端连接和消息：
   * - GET_PAGE: 获取页面数据
   * - UPDATE_PAGE: 更新页面属性
   */
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('客户端已连接');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            case 'GET_PAGE':
              const page = await this.notion.pages.retrieve({ page_id: data.pageId });
              ws.send(JSON.stringify({ type: 'PAGE_DATA', data: page }));
              break;
              
            case 'UPDATE_PAGE':
              const updatedPage = await this.notion.pages.update({
                page_id: data.pageId,
                properties: data.properties
              });
              ws.send(JSON.stringify({ type: 'PAGE_UPDATED', data: updatedPage }));
              break;
              
            default:
              ws.send(JSON.stringify({ type: 'ERROR', message: '未知命令' }));
          }
        } catch (error) {
          ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
        }
      });
    });
  }
}

// 当直接运行此文件时启动服务器
if (require.main === module) {
  try {
    new NotionMCPServer();
  } catch (error) {
    console.error('启动MCP服务器失败:', error.message);
    process.exit(1);
  }
}

module.exports = NotionMCPServer; 
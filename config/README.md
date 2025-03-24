# 配置指南

此目录包含应用程序的配置文件，用于定义模板、静态数据等非敏感信息。

## 配置文件概览

- `invitation.template.json`: 邀请函模板
- `leaders.json`: 领读人和主持人信息（使用isHost字段标识主持人角色）
- `book-schedule.json`: 书单排期数据

## 环境变量配置

敏感配置信息存储在项目根目录的`.env`文件中。请参考`.env.example`文件创建自己的`.env`文件，并填写相应的值。

**重要**: `.env`文件包含敏感信息，不应提交到版本控制系统。

### 必需的环境变量

- `NOTION_API_KEY`: Notion API密钥
- `NOTION_BOOKLIST_DATABASE_ID`: 书单数据库ID

### 可选的环境变量

- `NOTION_PAGE_ID`: Notion页面ID
- `NOTION_BOOKLIST_NAME`: 书单数据库名称（默认为"书单"）
- `MCP_SERVER_PORT`: MCP服务器端口（默认为8080）

## 使用配置模块

项目中的代码通过`src/config-loader.js`模块访问配置。这种方式确保了一致的配置访问，并提供了验证和默认值处理。

```javascript
const config = require('./config-loader');

// 使用Notion API配置
const notionConfig = config.getNotionConfig();

// 获取数据库ID
const booklistId = config.getDatabaseId('booklist');

// 访问其他配置
const serverPort = config.server.port;
``` 
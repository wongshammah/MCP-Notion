# MCP-Notion

前海读书会Notion自动化工具，用于生成和管理读书会邀请函。

## 功能特性

- 自动生成读书会邀请函（JSON和纯文本格式）
- 与Notion API实时交互
- 支持多个领读人配置
- 灵活的会议室管理
- WebSocket实时通信
- 本地排期管理
- 排期对比与同步
- 交互式邀请函生成

## 安装和配置

1. 克隆仓库并安装依赖：
   ```bash
   git clone https://github.com/your-username/MCP-Notion.git
   cd MCP-Notion
   npm install
   ```

2. 复制环境变量示例文件并配置：
   ```bash
   cp .env.example .env
   ```
   
   编辑`.env`文件，填入您的Notion API密钥和其他必要信息。

3. 启动服务：
   ```bash
   npm start
   ```

## 排期管理

本项目提供完整的排期管理工具集：

1. **获取Notion排期**：
   ```bash
   npm run fetch-schedule
   ```

2. **本地管理排期**（添加、编辑、删除）：
   ```bash
   npm run update-schedule
   ```

3. **对比本地与Notion排期**：
   ```bash
   npm run check-schedule
   ```

详细的排期管理说明请参阅 [排期管理指南](scripts/README.md)。

## 生成邀请函

使用交互式邀请函生成工具：
```bash
npm run invitation
```

该工具会自动检测最新排期，并引导您完成邀请函生成的整个流程。生成的邀请函将保存在`output/`目录下。

## 项目结构

```
MCP-Notion/
├── config/                 # 配置文件目录
│   ├── invitation.template.json  # 邀请函模板
│   ├── leaders.json        # 领读人和主持人信息
│   └── book-schedule.json  # 书单排期数据（由脚本生成）
├── output/                 # 生成的邀请函输出目录
├── scripts/                # 脚本工具目录
│   ├── fetch-book-schedule.js    # 获取排期数据
│   ├── check-schedule-diff.js    # 检查排期差异
│   ├── update-local-schedule.js  # 本地排期管理
│   └── generate-invitation.js    # 邀请函生成工具
└── src/                    # 源代码目录
    ├── book-schedule-manager.js  # 排期管理类
    ├── config-loader.js          # 配置加载器
    ├── invitation-generator.js   # 邀请函生成器
    └── notion-mcp-server.js      # Notion WebSocket服务器
```

## 配置系统

本项目使用分层配置系统：

- **环境变量**：存储敏感信息（API密钥、数据库ID等）
- **配置文件**：存储模板和静态数据（位于`config/`目录）

详细的配置说明请参阅 [配置指南](config/README.md)。

## 配置文件说明

### 邀请函模板 (config/invitation.template.json)

邀请函模板使用占位符来支持动态内容：

- `{period}`: 读书会期数
- `{date}`: 活动日期
- `{bookName}`: 书籍名称
- `{bookIntro}`: 书籍简介
- `{leaderName}`: 领读人姓名
- `{leaderIntro}`: 领读人介绍
- `{roomNumber}`: 会议室号码
- `{wechatLink}`: 微信接龙链接

模板结构说明：
```json
{
  "title": "邀请函标题",
  "header": "头部信息",
  "bookTitle": "书籍标题",
  "bookIntro": "书籍简介",
  "leader": {
    "title": "领读人标题",
    "intro": "领读人介绍"
  },
  "activityInfo": {
    "time": "活动时间信息",
    "location": "活动地点信息",
    "transportation": "交通信息"
  },
  "notes": "活动注意事项",
  "registration": "报名信息",
  "meetingRooms": "可用会议室列表"
}
```

### 领读人配置 (config/leaders.json)

领读人配置文件包含所有可用领读人和主持人的信息：

- `name`: 姓名
- `title`: 头衔/职称
- `intro`: 个人简介
- `isHost`: 是否可作为主持人（布尔值）

## 使用方法

1. 安装依赖：
```bash
npm install
```

2. 配置Notion API令牌：
在 `.env` 文件中设置你的Notion API令牌（`NOTION_API_KEY`）。

3. 启动MCP服务器：
```bash
npm start
```

4. 生成邀请函示例：
```javascript
const InvitationGenerator = require('./src/invitation-generator');

const generator = new InvitationGenerator();
const invitation = generator.generate({
  period: 50,
  date: '2024-03-21',
  bookName: '思考，快与慢',
  bookIntro: '这是一本关于人类思维的深度解析...',
  leaderName: 'Apple',
  roomNumber: '106',
  wechatLink: 'https://example.com/signup'
});
```

## 开发说明

- 使用Node.js v14+
- 使用WebSocket进行实时通信
- 使用@notionhq/client进行Notion API调用

## 注意事项

- 所有敏感信息（如API令牌、数据库ID）应存放在`.env`文件中
- 确保领读人名称在生成邀请函时与配置文件匹配
- 定期备份Notion数据库
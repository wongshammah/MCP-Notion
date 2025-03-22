# 贡献指南

感谢您对前海读书会Notion自动化工具的关注！我们非常欢迎社区贡献，本指南将帮助您了解如何参与项目开发。

## 开发环境设置

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/MCP-Notion.git
   cd MCP-Notion
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 复制并配置环境变量：
   ```bash
   cp .env.example .env
   ```
   
   编辑`.env`文件，填入相关配置。

## 代码规范

- 使用ESLint进行代码检查
- 所有函数和类必须包含JSDoc文档注释
- 变量和函数命名采用驼峰命名法
- 保持代码模块化和单一职责原则

## 提交规范

我们使用约定式提交规范(Conventional Commits)：

```
<类型>[可选 范围]: <描述>

[可选 正文]

[可选 脚注]
```

提交类型包括：
- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档变更
- `style`: 不影响代码功能的变更（空格、格式、缺少分号等）
- `refactor`: 代码重构（不包括bug修复和功能添加）
- `perf`: 性能优化
- `test`: 添加或修改测试
- `build`: 影响构建系统或外部依赖的更改
- `ci`: 对CI配置文件和脚本的更改
- `chore`: 其他不修改源代码或测试文件的更改

示例：
```
feat(邀请函): 添加微信分享功能

添加邀请函生成微信分享图片的功能，支持自定义背景和Logo。

关闭 #123
```

## 分支管理

- `main`: 稳定分支，只接受经过充分测试的PR
- `develop`: 开发分支，接受新功能和bug修复
- 功能分支：命名为`feature/功能名称`
- bug修复分支：命名为`fix/bug描述`

## Pull Request流程

1. Fork仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'feat: 添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个Pull Request

## 版本发布流程

我们使用语义化版本控制（Semantic Versioning）：

- 主版本号：不兼容的API变更
- 次版本号：向后兼容的功能性新增
- 修订号：向后兼容的问题修正

## 问题反馈

如果您发现了Bug或有功能建议，请使用GitHub Issues功能提交，并使用相应的问题模板。

感谢您的贡献！ 
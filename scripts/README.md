# 书单排期管理脚本

本目录包含了用于管理前海读书会排期的各种脚本工具。

## 脚本概览

- **`fetch-book-schedule.js`**: 从Notion数据库获取排期，保存到本地
- **`check-schedule-diff.js`**: 对比本地排期与Notion排期，显示差异
- **`update-local-schedule.js`**: 管理本地排期（添加、编辑、删除）
- **`generate-invitation.js`**: 基于排期信息生成读书会邀请函
- **`list-book-schedule.js`**: 遍历并展示所有书单信息，提供数据分析
- **`list-all-books.js`**: 完整列出所有历史书单的基本信息，按时间顺序排列

## 使用方法

### 1. 获取排期

从Notion获取排期并保存到本地：

```bash
npm run fetch-schedule
```

此命令会从配置的Notion数据库中获取所有排期信息，并保存到`config/book-schedule.json`文件中。

### 2. 管理本地排期

通过交互式界面管理本地排期：

```bash
npm run update-schedule
```

功能：
- 查看排期列表
- 添加新排期
- 编辑现有排期
- 删除排期
- 保存并退出

### 3. 检查排期差异

对比本地排期与Notion排期的差异：

```bash
npm run check-schedule
```

此命令会显示：
- 本地有但Notion中没有的排期
- Notion有但本地没有的排期
- 信息不一致的排期

### 4. 生成邀请函

基于排期信息生成读书会邀请函：

```bash
npm run invitation
```

此工具会：
- 自动检测最新排期
- 提供交互式问答进行信息补充
- 生成格式化的邀请函
- 将结果保存到`output/`目录

### 5. 查看书单分析

遍历并展示所有书单，提供数据分析：

```bash
npm run list-schedule
```

此工具会：
- 显示完整的书单列表（按日期排序）
- 提供年度分布统计
- 显示领读人统计信息
- 分析领读频率最高的人

### 6. 完整列出所有历史书单

完整列出所有历史书单基本信息，按时间顺序排列：

```bash
npm run list-all-books
```

此工具会：
- 按照时间顺序（从旧到新）显示所有书单
- 以表格形式整齐展示每本书的基本信息
- 不进行统计分析，专注于展示完整的历史数据

## 同步排期工作流

推荐的工作流程：

1. 获取最新Notion排期 (`npm run fetch-schedule`)
2. 在本地修改排期 (`npm run update-schedule`)
3. 检查排期差异 (`npm run check-schedule`)
4. 在Notion中手动更新差异部分
5. 再次运行检查确认同步完成 (`npm run check-schedule`)
6. 使用最新排期生成邀请函 (`npm run invitation`)

## 注意事项

- 当前实现不会自动更新Notion数据库，所有对Notion的更新需手动操作
- 确保`.env`文件中正确配置了Notion API令牌和数据库ID
- 生成的排期文件会保存在`config/book-schedule.json`中
- 生成的邀请函会保存在`output/`目录中 
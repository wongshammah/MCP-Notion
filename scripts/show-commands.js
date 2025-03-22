/**
 * @fileoverview 显示所有可用的脚本命令及其说明
 */

const chalk = require('chalk');

const commands = [
  {
    command: 'npm run fetch-schedule',
    description: '从Notion数据库获取最新的书单排期数据'
  },
  {
    command: 'npm run check-schedule',
    description: '检查本地排期数据与Notion数据库的差异'
  },
  {
    command: 'npm run update-schedule',
    description: '更新本地排期数据，支持添加、编辑、删除排期'
  },
  {
    command: 'npm run invitation',
    description: '生成读书会邀请函'
  },
  {
    command: 'npm run analyze-schedule',
    description: '分析排期数据，显示统计信息和模式分析'
  },
  {
    command: 'npm run show-fields',
    description: '显示数据库字段结构'
  },
  {
    command: 'npm run show-full-booklist',
    description: '显示完整的书单信息，支持字段过滤'
  }
];

function showCommands() {
  console.log(chalk.blue.bold('\n=== 前海读书会自动化工具 ===\n'));
  console.log(chalk.gray('可用的命令列表：\n'));

  commands.forEach(({ command, description }) => {
    console.log(chalk.yellow(command));
    console.log(chalk.gray(`  ${description}\n`));
  });

  console.log(chalk.blue.bold('\n=== 使用说明 ===\n'));
  console.log(chalk.gray('1. 所有命令都需要在项目根目录下执行'));
  console.log(chalk.gray('2. 确保已安装所有依赖：npm install'));
  console.log(chalk.gray('3. 确保配置文件正确设置'));
  console.log(chalk.gray('4. 如需查看具体命令的详细用法，请查看对应脚本的注释\n'));
}

showCommands(); 
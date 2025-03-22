/**
 * @fileoverview 生成读书会邀请函脚本
 * 基于最新排期生成读书会邀请函
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const InvitationGenerator = require('../src/invitation-generator');
const BookScheduleManager = require('../src/book-schedule-manager');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 异步提问函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * 生成读书会邀请函
 */
async function generateInvitation() {
  try {
    console.log(chalk.blue('读书会邀请函生成工具\n'));
    
    // 获取最新排期信息
    const scheduleManager = new BookScheduleManager();
    const latestSchedule = scheduleManager.getLatestSchedule();
    
    if (!latestSchedule) {
      console.log(chalk.yellow('未找到排期信息，请先运行 npm run fetch-schedule 获取排期'));
      return;
    }
    
    console.log(chalk.green('找到最新排期:'));
    console.log(`- 日期: ${chalk.cyan(latestSchedule.date)}`);
    console.log(`- 书名: ${chalk.cyan(latestSchedule.bookName)}`);
    console.log(`- 领读人: ${chalk.cyan(latestSchedule.leaderName || '未指定')}`);
    console.log(`- 期数: ${chalk.cyan(latestSchedule.period || '未指定')}\n`);
    
    // 询问是否使用该排期生成邀请函
    const useLatest = await question(chalk.yellow('是否使用该排期生成邀请函? (y/n): '));
    
    let invitationData = {};
    
    if (useLatest.toLowerCase() === 'y') {
      // 使用最新排期
      invitationData = {
        period: latestSchedule.period || await question('请输入期数: '),
        date: latestSchedule.date,
        bookName: latestSchedule.bookName,
        leaderName: latestSchedule.leaderName || await question('请输入领读人: ')
      };
    } else {
      // 手动输入
      invitationData = {
        period: await question('请输入期数: '),
        date: await question('请输入日期 (YYYY-MM-DD): '),
        bookName: await question('请输入书名: '),
        leaderName: await question('请输入领读人: ')
      };
    }
    
    // 补充其他信息
    invitationData.bookIntro = await question('请输入书籍简介: ');
    invitationData.roomNumber = await question('请输入会议室号码 (默认106): ') || '106';
    invitationData.wechatLink = await question('请输入微信接龙链接: ');
    
    // 生成邀请函
    const generator = new InvitationGenerator();
    const invitation = generator.generateText(invitationData);
    
    // 输出到文件和控制台
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const filename = `邀请函-${invitationData.period || '未知期数'}-${invitationData.date}.txt`;
    const outputPath = path.join(outputDir, filename);
    
    fs.writeFileSync(outputPath, invitation, 'utf8');
    
    console.log(chalk.green('\n邀请函生成成功!'));
    console.log(chalk.blue('邀请函内容:'));
    console.log(chalk.white(invitation));
    console.log(chalk.green(`\n邀请函已保存至: ${outputPath}`));
    
  } catch (error) {
    console.error(chalk.red('生成邀请函时出错:'), error.message);
  } finally {
    rl.close();
  }
}

// 执行脚本
generateInvitation(); 
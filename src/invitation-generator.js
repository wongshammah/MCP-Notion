/**
 * @fileoverview 邀请函生成器
 * 用于生成前海读书会活动邀请函，支持JSON和纯文本两种格式
 * 自动从配置文件中读取模板和领读人信息
 */

const fs = require('fs');
const path = require('path');
const config = require('./config-loader');

/**
 * 邀请函生成器类
 * @class InvitationGenerator
 * @description 处理读书会邀请函的生成，包括：
 * 1. 自动读取并使用配置文件中的模板
 * 2. 自动读取并验证领读人信息
 * 3. 支持生成JSON和纯文本两种格式
 * 4. 提供参数验证和错误处理
 */
class InvitationGenerator {
  /**
   * 创建邀请函生成器实例
   * @constructor
   * @throws {Error} 如果配置文件不存在或格式错误
   */
  constructor() {
    try {
      // 读取配置文件
      const templatePath = path.join(__dirname, '..', config.paths.invitationTemplate);
      const leadersPath = path.join(__dirname, '..', config.paths.leaders);
      
      this.template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      this.leaders = JSON.parse(fs.readFileSync(leadersPath, 'utf8')).leaders;
    } catch (error) {
      throw new Error(`初始化邀请函生成器失败: ${error.message}`);
    }
  }

  /**
   * 生成JSON格式的邀请函
   * @param {Object} params - 邀请函参数
   * @param {number} params.period - 读书会期数，例如：50
   * @param {string} params.date - 活动日期，格式：YYYY-MM-DD
   * @param {string} params.bookName - 本期书籍名称
   * @param {string} params.bookIntro - 书籍简介
   * @param {string} params.leaderName - 领读人姓名（必须在leaders.json中存在）
   * @param {string} params.roomNumber - 会议室号，例如：106
   * @param {string} params.wechatLink - 微信接龙链接
   * @returns {Object} 生成的邀请函JSON对象
   * @throws {Error} 当领读人不存在时抛出错误
   */
  generate(params) {
    // 深拷贝模板以避免修改原始模板
    const invitation = JSON.parse(JSON.stringify(this.template));
    const leader = this.leaders[params.leaderName];

    // 验证领读人是否存在
    if (!leader) {
      throw new Error(`领读人 "${params.leaderName}" 未找到`);
    }

    // 替换模板中的所有变量
    invitation.title = invitation.title.replace('{period}', params.period);
    invitation.header = invitation.header.replace('{date}', params.date);
    invitation.bookTitle = invitation.bookTitle.replace('{bookName}', params.bookName);
    invitation.bookIntro = params.bookIntro;
    invitation.leader.title = invitation.leader.title.replace('{leaderName}', params.leaderName);
    invitation.leader.intro = leader.intro;
    invitation.activityInfo.time.content = invitation.activityInfo.time.content.replace('{date}', params.date);
    invitation.activityInfo.location.content = invitation.activityInfo.location.content.replace('{roomNumber}', params.roomNumber);
    invitation.registration.content = invitation.registration.content.replace('{wechatLink}', params.wechatLink);

    return invitation;
  }

  /**
   * 生成纯文本格式的邀请函
   * @param {Object} params - 同generate方法的参数
   * @returns {string} 格式化的纯文本邀请函
   * @description 生成适合直接发送的文本格式邀请函，包含：
   * 1. 标题和头部信息
   * 2. 书籍信息
   * 3. 领读人信息
   * 4. 活动详细信息
   * 5. 温馨提示
   * 6. 报名方式
   */
  generateText(params) {
    const invitation = this.generate(params);
    
    // 构建文本格式的邀请函
    let text = '';
    // 添加标题和头部信息
    text += invitation.title + '\n\n';
    text += invitation.header + '\n\n';
    // 添加书籍信息
    text += invitation.bookTitle + '\n';
    text += invitation.bookIntro + '\n\n';
    // 添加领读人信息
    text += invitation.leader.title + '\n';
    text += invitation.leader.intro + '\n\n';
    
    // 添加活动信息（时间、地点、交通）
    Object.values(invitation.activityInfo).forEach(info => {
      text += info.title + info.content + '\n';
    });
    text += '\n';
    
    // 添加温馨提示
    text += invitation.notes.title + '\n';
    invitation.notes.items.forEach(item => {
      text += '- ' + item + '\n';
    });
    text += '\n';
    
    // 添加报名方式
    text += invitation.registration.title + invitation.registration.content + '\n';
    
    return text;
  }
}

// 导出邀请函生成器类
module.exports = InvitationGenerator; 
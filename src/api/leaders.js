const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const LEADERS_FILE_PATH = path.join(__dirname, '../../config/leaders.json');

// 读取leaders.json文件
async function readLeadersFile() {
  try {
    const data = await fs.readFile(LEADERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取leaders.json失败:', error);
    throw error;
  }
}

// 写入leaders.json文件
async function writeLeadersFile(data) {
  try {
    await fs.writeFile(LEADERS_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('写入leaders.json失败:', error);
    throw error;
  }
}

// 获取所有领读人
router.get('/', async (req, res) => {
  try {
    const data = await readLeadersFile();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取领读人列表失败' });
  }
});

// 添加新领读人
router.post('/', async (req, res) => {
  try {
    const newLeader = req.body;
    const data = await readLeadersFile();
    
    // 检查是否已存在
    if (data.leaders[newLeader.name]) {
      return res.status(400).json({ error: '该领读人已存在' });
    }

    // 添加新领读人
    data.leaders[newLeader.name] = newLeader;
    await writeLeadersFile(data);
    
    res.status(201).json(newLeader);
  } catch (error) {
    res.status(500).json({ error: '添加领读人失败' });
  }
});

// 更新领读人信息
router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const updatedLeader = req.body;
    const data = await readLeadersFile();

    // 检查是否存在
    if (!data.leaders[name]) {
      return res.status(404).json({ error: '未找到该领读人' });
    }

    // 更新领读人信息
    data.leaders[name] = updatedLeader;
    await writeLeadersFile(data);

    res.json(updatedLeader);
  } catch (error) {
    res.status(500).json({ error: '更新领读人信息失败' });
  }
});

// 删除领读人
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const data = await readLeadersFile();

    // 检查是否存在
    if (!data.leaders[name]) {
      return res.status(404).json({ error: '未找到该领读人' });
    }

    // 删除领读人
    delete data.leaders[name];
    await writeLeadersFile(data);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '删除领读人失败' });
  }
});

module.exports = router; 
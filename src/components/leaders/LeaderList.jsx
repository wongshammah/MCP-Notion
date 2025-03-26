import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Switch, Tag, Space, Button, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import LeaderForm from './LeaderForm';

const { Search } = Input;

const LeaderList = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showOnlyHosts, setShowOnlyHosts] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);

  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          {text}
          {record.isHost && <Tag color="green">主持人</Tag>}
        </Space>
      ),
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '简介',
      dataIndex: 'intro',
      key: 'intro',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 获取领读人数据
  const fetchLeaders = async () => {
    try {
      setLoading(true);
      console.log('开始获取领读人数据...');
      
      const response = await fetch('http://localhost:3001/api/leaders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('获取到的数据:', data);
      
      // 将对象转换为数组
      const leadersArray = Object.values(data.leaders || {});
      console.log('转换后的数组:', leadersArray);
      
      setLeaders(leadersArray);
    } catch (error) {
      console.error('获取领读人数据失败:', error);
      message.error('获取领读人数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  // 处理搜索
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // 处理编辑
  const handleEdit = (leader) => {
    setEditingLeader(leader);
    setIsModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (leader) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除领读人 ${leader.name} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/leaders/${leader.name}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          message.success('删除成功');
          fetchLeaders();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败: ' + error.message);
        }
      },
    });
  };

  // 处理表单提交
  const handleFormSubmit = async (values) => {
    try {
      const method = editingLeader ? 'PUT' : 'POST';
      const url = editingLeader 
        ? `http://localhost:3001/api/leaders/${editingLeader.name}` 
        : 'http://localhost:3001/api/leaders';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      message.success(`${editingLeader ? '更新' : '添加'}成功`);
      setIsModalVisible(false);
      setEditingLeader(null);
      fetchLeaders();
    } catch (error) {
      console.error(`${editingLeader ? '更新' : '添加'}失败:`, error);
      message.error(`${editingLeader ? '更新' : '添加'}失败: ` + error.message);
    }
  };

  // 过滤数据
  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch = 
      leader.name.toLowerCase().includes(searchText.toLowerCase()) ||
      leader.title.toLowerCase().includes(searchText.toLowerCase()) ||
      leader.intro.toLowerCase().includes(searchText.toLowerCase());
    
    if (showOnlyHosts) {
      return matchesSearch && leader.isHost;
    }
    return matchesSearch;
  });

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} size="large">
        <Search
          placeholder="搜索领读人"
          allowClear
          onSearch={handleSearch}
          style={{ width: 200 }}
        />
        <Switch
          checkedChildren="只看主持人"
          unCheckedChildren="全部"
          checked={showOnlyHosts}
          onChange={setShowOnlyHosts}
        />
        <Button 
          type="primary"
          onClick={() => {
            setEditingLeader(null);
            setIsModalVisible(true);
          }}
        >
          添加领读人
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredLeaders}
        loading={loading}
        rowKey="name"
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      <Modal
        title={editingLeader ? '编辑领读人' : '添加领读人'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingLeader(null);
        }}
        footer={null}
      >
        <LeaderForm
          initialValues={editingLeader}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingLeader(null);
          }}
        />
      </Modal>
    </Card>
  );
};

export default LeaderList; 
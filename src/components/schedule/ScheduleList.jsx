import React, { useState, useEffect } from 'react';
import { Table, Button, message, Modal, Calendar, Tabs, Space, Badge, Card, Tag, Input } from 'antd';
import { PlusOutlined, SyncOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import ScheduleForm from './ScheduleForm';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

const { TabPane } = Tabs;
const { Search } = Input;

const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' 或 'calendar'
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [syncingStatus, setSyncingStatus] = useState({
    syncing: false,
    lastSynced: null,
    error: null,
  });

  useEffect(() => {
    fetchSchedules();
    fetchLeaders();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/schedules');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('获取到的排期数据:', data);
      setSchedules(data.schedule || []);
    } catch (error) {
      console.error('获取排期失败:', error);
      message.error('获取排期列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/leaders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('获取到的领读人数据:', data); // 调试信息
      // 确保设置的是一个数组
      setLeaders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取领读人失败:', error);
      setLeaders([]); // 出错时设置为空数组
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setModalVisible(true);
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setModalVisible(true);
  };

  const handleDeleteSchedule = (date) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个排期吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/schedules/${date}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          message.success('排期删除成功');
          fetchSchedules();
        } catch (error) {
          console.error('删除排期失败:', error);
          message.error('删除排期失败，请重试');
        }
      },
    });
  };

  const handleFormSubmit = async (values) => {
    setConfirmLoading(true);
    try {
      const url = editingSchedule 
        ? `http://localhost:3001/api/schedules/${editingSchedule.date}`
        : 'http://localhost:3001/api/schedules';
      
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      message.success(`${editingSchedule ? '更新' : '添加'}排期成功`);
      setModalVisible(false);
      fetchSchedules();
    } catch (error) {
      console.error(`${editingSchedule ? '更新' : '添加'}排期失败:`, error);
      message.error(error.message || `${editingSchedule ? '更新' : '添加'}排期失败，请重试`);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSyncToNotion = async () => {
    setSyncingStatus({ ...syncingStatus, syncing: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/schedules/sync', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      
      message.success('同步到Notion成功');
      setSyncingStatus({ 
        syncing: false, 
        lastSynced: new Date().toLocaleString(), 
        error: null 
      });
    } catch (error) {
      console.error('同步到Notion失败:', error);
      message.error('同步到Notion失败: ' + error.message);
      setSyncingStatus({ 
        ...syncingStatus, 
        syncing: false, 
        error: error.message 
      });
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (text) => moment(text).format('YYYY-MM-DD'),
    },
    {
      title: '书名',
      dataIndex: 'bookName',
      key: 'bookName',
    },
    {
      title: '领读人',
      dataIndex: 'leaderName',
      key: 'leaderName',
      render: (text) => {
        const leader = Array.isArray(leaders) ? leaders.find(l => l.name === text) : null;
        return leader?.isHost ? <Tag color="blue">{text} (主持人)</Tag> : text;
      },
    },
    {
      title: '主持人',
      dataIndex: 'hostName',
      key: 'hostName',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditSchedule(record)}
          >
            编辑
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => handleDeleteSchedule(record.date)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const filteredSchedules = schedules.filter(schedule => {
    return (
      schedule.bookName.toLowerCase().includes(searchText.toLowerCase()) ||
      schedule.leaderName.toLowerCase().includes(searchText.toLowerCase()) ||
      schedule.hostName.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const schedulesForDate = schedules.filter(s => s.date === dateStr);
    
    return (
      <div className="calendar-cell">
        {schedulesForDate.map((s, index) => (
          <div key={index} className="calendar-event">
            <div className="calendar-event-title">{s.bookName}</div>
            <div className="calendar-event-leader">领读: {s.leaderName}</div>
            <div className="calendar-event-host">主持: {s.hostName}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddSchedule}
            style={{ marginRight: 8 }}
          >
            添加排期
          </Button>
          <Button
            icon={<SyncOutlined spin={syncingStatus.syncing} />}
            onClick={handleSyncToNotion}
            loading={syncingStatus.syncing}
          >
            同步到Notion
          </Button>
        </div>
        <div>
          <Button.Group>
            <Button 
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
            >
              列表视图
            </Button>
            <Button 
              type={viewMode === 'calendar' ? 'primary' : 'default'}
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('calendar')}
            >
              日历视图
            </Button>
          </Button.Group>
        </div>
      </Space>

      {viewMode === 'list' && (
        <>
          <Search
            placeholder="搜索书名、领读人或主持人"
            style={{ marginBottom: 16 }}
            onSearch={value => setSearchText(value)}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Table
            columns={columns}
            dataSource={filteredSchedules}
            rowKey="date"
            loading={loading}
          />
        </>
      )}

      {viewMode === 'calendar' && (
        <Card>
          <Calendar
            dateCellRender={dateCellRender}
          />
        </Card>
      )}

      <Modal
        title={editingSchedule ? '编辑排期' : '添加排期'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        confirmLoading={confirmLoading}
      >
        <ScheduleForm
          initialValues={editingSchedule}
          onSubmit={handleFormSubmit}
          onCancel={() => setModalVisible(false)}
          confirmLoading={confirmLoading}
        />
      </Modal>
    </div>
  );
};

export default ScheduleList; 
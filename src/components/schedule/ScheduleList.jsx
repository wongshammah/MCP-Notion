import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Calendar, Card, Tag } from 'antd';
import { CalendarOutlined, UnorderedListOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/zh-cn';
import ScheduleForm from './ScheduleForm';
import { api, API_ENDPOINTS } from '../../utils/api';
import '../../styles/schedule.css';

moment.locale('zh-cn');

const ScheduleList = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // 获取排期数据
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await api.get(API_ENDPOINTS.SCHEDULES);
      if (data && data.schedule) {
        setSchedules(data.schedule);
      } else {
        message.error('获取排期数据失败，返回格式不正确');
      }
    } catch (error) {
      console.error('获取排期失败:', error);
      message.error(`获取排期失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 同步Notion数据
  const syncWithNotion = async () => {
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const result = await api.post(API_ENDPOINTS.SYNC_SCHEDULES);
      setSyncStatus({
        success: true,
        message: result.message,
        details: `${result.totalCreated || 0}条新增，${result.totalUpdated || 0}条更新，${result.totalErrors || 0}条错误`
      });
      message.success('同步成功');
      fetchSchedules();
    } catch (error) {
      console.error('同步失败:', error);
      setSyncStatus({
        success: false,
        message: `同步失败: ${error.message}`,
      });
      message.error(`同步失败: ${error.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // 删除排期
  const handleDelete = async (date) => {
    try {
      await api.delete(API_ENDPOINTS.SCHEDULE(date));
      message.success('删除成功');
      fetchSchedules();
    } catch (error) {
      console.error('删除失败:', error);
      message.error(`删除失败: ${error.message}`);
    }
  };

  // 打开编辑模态框
  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setModalVisible(false);
    setEditingSchedule(null);
  };

  // 提交表单
  const handleFormSubmit = async (values) => {
    try {
      if (editingSchedule) {
        // 更新
        await api.put(API_ENDPOINTS.SCHEDULE(editingSchedule.date), values);
        message.success('排期更新成功');
      } else {
        // 新增
        await api.post(API_ENDPOINTS.SCHEDULES, values);
        message.success('排期添加成功');
      }
      setModalVisible(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('提交失败:', error);
      message.error(`提交失败: ${error.message}`);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (text) => moment(text).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.date).valueOf() - moment(b.date).valueOf(),
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
        <Space size="middle">
          <Button type="link" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除"${record.bookName}"的排期吗？`,
                onOk: () => handleDelete(record.date),
              });
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 日历单元格渲染
  const dateCellRender = (value) => {
    const date = value.format('YYYY-MM-DD');
    const scheduleForDate = schedules.find(s => s.date === date);
    
    if (!scheduleForDate) return null;
    
    return (
      <div className="calendar-schedule">
        <div className="book-title">{scheduleForDate.bookName}</div>
        <div>
          <span>领读：{scheduleForDate.leaderName}</span>
          <br />
          <span>主持：{scheduleForDate.hostName}</span>
        </div>
      </div>
    );
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
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
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setModalVisible(true)}
          >
            添加排期
          </Button>
          <Button 
            type="default" 
            icon={<SyncOutlined spin={syncLoading} />} 
            onClick={syncWithNotion}
            loading={syncLoading}
          >
            同步Notion
          </Button>
        </Space>
        
        {syncStatus && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <div>
              <Tag color={syncStatus.success ? 'success' : 'error'}>
                {syncStatus.success ? '同步成功' : '同步失败'}
              </Tag>
              <span>{syncStatus.message}</span>
              {syncStatus.details && <div>{syncStatus.details}</div>}
            </div>
          </Card>
        )}
      </div>

      {viewMode === 'list' ? (
        <Table 
          columns={columns} 
          dataSource={schedules} 
          rowKey="date" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <div className="calendar-view">
          <Calendar dateCellRender={dateCellRender} />
        </div>
      )}

      <Modal
        title={editingSchedule ? '编辑排期' : '添加排期'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <ScheduleForm
          initialValues={editingSchedule}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  );
};

export default ScheduleList; 
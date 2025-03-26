import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Space, message } from 'antd';
import moment from 'moment';
import { api, API_ENDPOINTS } from '../../utils/api';

const { Option } = Select;

const ScheduleForm = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [leaders, setLeaders] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取领导者和主持人列表
  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const data = await api.get(API_ENDPOINTS.LEADERS);
        
        // 确保数据是数组
        if (Array.isArray(data)) {
          // 分离领导者和主持人
          const allLeaders = data.map(l => l.name);
          const hostLeaders = data.filter(l => l.isHost).map(l => l.name);
          
          setLeaders(allLeaders);
          setHosts(hostLeaders);
        } else {
          console.error('获取到的领导者数据格式不正确');
          message.error('获取领导者数据失败，请刷新页面重试');
        }
      } catch (error) {
        console.error('获取领导者失败:', error);
        message.error(`获取领导者失败: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  // 如果有初始值，设置表单初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        date: initialValues.date ? moment(initialValues.date) : null,
      });
    }
  }, [form, initialValues]);

  // 提交表单
  const handleSubmit = async (values) => {
    // 格式化日期
    const formattedValues = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    };
    
    onSubmit(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues ? {
        ...initialValues,
        date: initialValues.date ? moment(initialValues.date) : null,
      } : {}}
    >
      <Form.Item
        name="date"
        label="日期"
        rules={[{ required: true, message: '请选择日期' }]}
      >
        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item
        name="bookName"
        label="书名"
        rules={[{ required: true, message: '请输入书名' }]}
      >
        <Input placeholder="请输入书名" />
      </Form.Item>

      <Form.Item
        name="leaderName"
        label="领读人"
        rules={[{ required: true, message: '请选择领读人' }]}
      >
        <Select
          placeholder="请选择领读人"
          showSearch
          loading={loading}
          allowClear
        >
          {leaders.map(name => (
            <Option key={name} value={name}>{name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="hostName"
        label="主持人"
        rules={[{ required: true, message: '请选择主持人' }]}
      >
        <Select
          placeholder="请选择主持人"
          showSearch
          loading={loading}
          allowClear
        >
          {hosts.map(name => (
            <Option key={name} value={name}>{name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">
            {initialValues ? '更新' : '添加'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ScheduleForm; 
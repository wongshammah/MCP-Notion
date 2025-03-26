import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, Space, message } from 'antd';
import moment from 'moment';

const { Option } = Select;

const ScheduleForm = ({ initialValues, onSubmit, onCancel, confirmLoading }) => {
  const [form] = Form.useForm();
  const [leaders, setLeaders] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载领读人和主持人列表
  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/leaders');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('获取到的领读人数据:', data); // 调试信息
        
        // 确保数据是数组
        const leadersArray = Array.isArray(data) ? data : [];
        
        // 所有领读人
        setLeaders(leadersArray);
        
        // 只有主持人
        const hostsOnly = leadersArray.filter(leader => leader.isHost);
        setHosts(hostsOnly);
      } catch (error) {
        console.error('获取领读人列表失败:', error);
        message.error('获取领读人列表失败，请重试');
        // 设置为空数组避免错误
        setLeaders([]);
        setHosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  // 当初始值变化时，重置表单
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        date: moment(initialValues.date),
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    const formattedValues = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    };
    onSubmit(formattedValues);
  };

  return (
    <div className="schedule-form-wrapper">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues ? {
          ...initialValues,
          date: initialValues.date ? moment(initialValues.date) : undefined,
        } : {}}
      >
        <Form.Item
          name="date"
          label="日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
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
            loading={loading}
            showSearch
            optionFilterProp="children"
          >
            {leaders.map(leader => (
              <Option key={leader.id} value={leader.name}>
                {leader.name} {leader.isHost ? '(主持人)' : ''}
              </Option>
            ))}
            <Option value="未指定">未指定</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="hostName"
          label="主持人"
          rules={[{ required: true, message: '请选择主持人' }]}
        >
          <Select 
            placeholder="请选择主持人" 
            loading={loading}
            showSearch
            optionFilterProp="children"
          >
            {hosts.map(host => (
              <Option key={host.id} value={host.name}>{host.name}</Option>
            ))}
            <Option value="未指定">未指定</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={confirmLoading}>
              {initialValues ? '更新' : '添加'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ScheduleForm; 
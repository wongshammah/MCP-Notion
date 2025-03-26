import React from 'react';
import { Form, Input, Switch, Button, Space } from 'antd';

const { TextArea } = Input;

const LeaderForm = ({ initialValues, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  // 表单提交处理
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        isHost: false,
        ...initialValues,
      }}
    >
      <Form.Item
        name="name"
        label="姓名"
        rules={[
          { required: true, message: '请输入姓名' },
          { max: 20, message: '姓名不能超过20个字符' }
        ]}
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>

      <Form.Item
        name="title"
        label="职称"
        rules={[
          { required: true, message: '请输入职称' },
          { max: 50, message: '职称不能超过50个字符' }
        ]}
      >
        <Input placeholder="请输入职称" />
      </Form.Item>

      <Form.Item
        name="intro"
        label="简介"
        rules={[
          { required: true, message: '请输入简介' },
          { max: 500, message: '简介不能超过500个字符' }
        ]}
      >
        <TextArea
          placeholder="请输入简介"
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item
        name="isHost"
        label="是否为主持人"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit}>
            {initialValues ? '更新' : '添加'}
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default LeaderForm; 
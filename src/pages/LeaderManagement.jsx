import React from 'react';
import { Typography, Layout, Card, Statistic, Row, Col } from 'antd';
import { UserOutlined, TeamOutlined, BookOutlined } from '@ant-design/icons';
import LeaderList from '../components/leaders/LeaderList';

const { Title } = Typography;
const { Content } = Layout;

const LeaderManagement = () => {
  return (
    <Layout className="leader-management">
      <Content style={{ padding: '24px' }}>
        <Title level={2}>领读人管理</Title>
        
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总领读人数"
                value={17}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="主持人数量"
                value={5}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="本月排期场次"
                value={4}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <LeaderList />
      </Content>
    </Layout>
  );
};

export default LeaderManagement; 
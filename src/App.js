import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import LeaderList from './components/leaders/LeaderList';
import ScheduleList from './components/schedule/ScheduleList';
import './App.css';

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Router>
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <Header className="layout-header">
          <div className="logo" />
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
            <Menu.Item key="1">
              <Link to="/">领读人管理</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/schedules">排期管理</Link>
            </Menu.Item>
          </Menu>
        </Header>
        <Content className="layout-content">
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<LeaderList />} />
              <Route path="/schedules" element={<ScheduleList />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>前海读书会管理系统 ©2024</Footer>
      </Layout>
    </Router>
  );
}

export default App; 
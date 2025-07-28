import React, { useState, useEffect } from 'react';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MessageOutlined,
  ApartmentOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import ChatView from './views/ChatView';
import WorkflowView from './views/WorkflowView';
import RelaxedFlowView from './views/RelaxedFlowView';
import './App.css';

const { Header, Sider, Content, Footer } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['chat']);
  const navigate = useNavigate();
  const location = useLocation();

  // Update selected keys based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setSelectedKeys(['chat']);
    } else if (path === '/workflow') {
      setSelectedKeys(['workflow']);
    } else if (path === '/relaxedflow') {
      setSelectedKeys(['relaxedflow']);
    }
  }, [location.pathname]);

  // Navigation handler
  const navigateTo = (path: string) => {
    navigate(path);
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path === '/') {
      return 'Chat';
    } else if (path === '/workflow') {
      return 'Workflow';
    } else if (path === '/relaxedflow') {
      return 'RelaxedFlow';
    }
    return 'AI Workflow';
  };

  return (
    <ConfigProvider>
      <div className="app-container">
        <Layout style={{ minHeight: '100vh' }}>
          {/* Sidebar */}
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={240}
            theme="dark"
            className="sidebar"
          >
            <div className="logo">
              <h1>AI Workflow</h1>
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={selectedKeys}
              items={[
                {
                  key: 'chat',
                  icon: <MessageOutlined />,
                  label: 'Chat',
                  onClick: () => navigateTo('/')
                },
                {
                  key: 'workflow',
                  icon: <ApartmentOutlined />,
                  label: 'Workflow',
                  onClick: () => navigateTo('/workflow')
                },
                {
                  key: 'relaxedflow',
                  icon: <ThunderboltOutlined />,
                  label: 'RelaxedFlow',
                  onClick: () => navigateTo('/relaxedflow')
                }
              ]}
            />
          </Sider>

          {/* Main Content */}
          <Layout>
            {/* Header */}
            <Header className="header">
              {collapsed ? (
                <MenuUnfoldOutlined
                  className="trigger"
                  onClick={() => setCollapsed(!collapsed)}
                />
              ) : (
                <MenuFoldOutlined
                  className="trigger"
                  onClick={() => setCollapsed(!collapsed)}
                />
              )}
              <span className="page-title">{getCurrentPageTitle()}</span>
            </Header>

            {/* Content */}
            <Content className="content">
              <Routes>
                <Route path="/" element={<ChatView />} />
                <Route path="/workflow" element={<WorkflowView />} />
                <Route path="/relaxedflow" element={<RelaxedFlowView />} />
              </Routes>
            </Content>

            {/* Footer */}
            <Footer className="footer">
              AI Workflow Frontend &copy; {new Date().getFullYear()}
            </Footer>
          </Layout>
        </Layout>
      </div>
    </ConfigProvider>
  );
};

export default App;
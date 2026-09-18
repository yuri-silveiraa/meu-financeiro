import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Drawer } from 'antd';
import {
  DashboardOutlined,
  SwapOutlined,
  FileTextOutlined,
  FlagOutlined,
  SettingOutlined,
  WalletOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transacoes from './pages/Transacoes';
import Relatorios from './pages/Relatorios';
import Metas from './pages/Metas';
import GastosFixos from './pages/GastosFixos';
import Configuracoes from './pages/Configuracoes';

const { Header, Sider, Content } = Layout;

const MOBILE_BREAKPOINT = 768;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/transacoes', icon: <SwapOutlined />, label: 'Transações' },
  { key: '/gastosfixos', icon: <CalendarOutlined />, label: 'Fixos' },
  { key: '/relatorios', icon: <FileTextOutlined />, label: 'Relatórios' },
  { key: '/metas', icon: <FlagOutlined />, label: 'Metas' },
  { key: '/configuracoes', icon: <SettingOutlined />, label: 'Configurações' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const currentPageLabel = menuItems.find(item => item.key === location.pathname)?.label || 'Meu Financeiro';

  const sidebarMenu = (
    <Menu
      theme="dark"
      selectedKeys={[location.pathname]}
      mode="inline"
      items={menuItems}
      onClick={({ key }) => navigate(key)}
    />
  );

  return (
    <Layout className="app-shell" style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={closeDrawer}
          width={260}
          className="app-drawer"
          styles={{ body: { padding: 0, background: '#001529' }, header: { display: 'none' } }}
        >
          <div className="app-brand">
            <WalletOutlined />
            <span>Meu Financeiro</span>
          </div>
          {sidebarMenu}
        </Drawer>
      ) : (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          className="app-sidebar"
        >
          <div className="app-brand">
            <WalletOutlined />
            {!collapsed && <span>Meu Financeiro</span>}
          </div>
          {sidebarMenu}
        </Sider>
      )}
      <Layout className="app-main">
        <Header className="app-header">
          <div className="app-header-left">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                className="hamburger-btn"
              />
            )}
            <span className="app-header-title">{currentPageLabel}</span>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" className="user-menu-btn">
              <Avatar icon={<UserOutlined />} src={user?.avatar_url} size="small" />
              {!isMobile && <span>{user?.name || user?.email}</span>}
            </Button>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transacoes" element={<Transacoes />} />
            <Route path="/gastosfixos" element={<GastosFixos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

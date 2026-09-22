import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Drawer, ConfigProvider, Tooltip, theme as antdTheme } from 'antd';
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
  CreditCardOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transacoes from './pages/Transacoes';
import Cartoes from './pages/Cartoes';
import Relatorios from './pages/Relatorios';
import Metas from './pages/Metas';
import GastosFixos from './pages/GastosFixos';
import Configuracoes from './pages/Configuracoes';

const { Header, Sider, Content } = Layout;

const MOBILE_BREAKPOINT = 768;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/transacoes', icon: <SwapOutlined />, label: 'Transações' },
  { key: '/cartoes', icon: <CreditCardOutlined />, label: 'Cartões' },
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
  const { isDark, toggleTheme } = useTheme();
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
          styles={{ body: { padding: 0, background: '#070b14' }, header: { display: 'none' } }}
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
          <div className="app-header-right">
            <Tooltip title={isDark ? "Alternar para modo claro" : "Alternar para modo escuro (azul escuro)"}>
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Alternar tema"
              >
                {isDark ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" className="user-menu-btn">
                <Avatar icon={<UserOutlined />} src={user?.avatar_url} size="small" />
                {!isMobile && <span>{user?.name || user?.email}</span>}
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transacoes" element={<Transacoes />} />
            <Route path="/cartoes" element={<Cartoes />} />
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

function AppWithTheme() {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: isDark ? {
          colorPrimary: '#3b82f6',
          colorBgBase: '#080d19',
          colorBgContainer: '#131f38',
          colorBgElevated: '#1a2949',
          colorBorder: '#1e2f52',
          colorBorderSecondary: '#162440',
          colorText: '#f8fafc',
          colorTextSecondary: '#94a3b8',
          borderRadius: 10,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        } : {
          colorPrimary: '#2563eb',
          colorBgBase: '#f8fafc',
          colorBgContainer: '#ffffff',
          colorBorder: '#e2e8f0',
          colorText: '#0f172a',
          borderRadius: 10,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
      }}
    >
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
    </ConfigProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppWithTheme />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

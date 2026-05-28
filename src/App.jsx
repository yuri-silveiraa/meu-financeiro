import { useState } from 'react'
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  SwapOutlined,
  FileTextOutlined,
  FlagOutlined,
  SettingOutlined,
  WalletOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Transacoes from './pages/Transacoes';
import Relatorios from './pages/Relatorios';
import Metas from './pages/Metas';
import GastosFixos from './pages/GastosFixos';
import Configuracoes from './pages/Configuracoes';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'transacoes', icon: <SwapOutlined />, label: 'Transações' },
  { key: 'gastosfixos', icon: <CalendarOutlined />, label: 'Gastos Fixos' },
  { key: 'relatorios', icon: <FileTextOutlined />, label: 'Relatórios' },
  { key: 'metas', icon: <FlagOutlined />, label: 'Metas' },
  { key: 'configuracoes', icon: <SettingOutlined />, label: 'Configurações' },
];

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'transacoes': return <Transacoes />;
      case 'gastosfixos': return <GastosFixos />;
      case 'relatorios': return <Relatorios />;
      case 'metas': return <Metas />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 20,
          fontWeight: 600,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <WalletOutlined style={{ marginRight: 8 }} />
          Meu Financeiro
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['dashboard']}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => setCurrentPage(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', fontSize: 18 }}>
          {menuItems.find(item => item.key === currentPage)?.label}
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8 }}>
          {renderPage()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
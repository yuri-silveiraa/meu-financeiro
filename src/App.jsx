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
  const currentItem = menuItems.find(item => item.key === currentPage);
  const hasElectronApi = typeof window !== 'undefined' && Boolean(window.api);

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

  if (!hasElectronApi) {
    return (
      <div className="runtime-warning">
        <div>
          <WalletOutlined />
          <h1>Abra pelo Electron</h1>
          <p>Este app usa APIs locais para banco de dados e arquivos. Rode <strong>npm run dev</strong> para abrir a janela correta.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout className="app-shell">
      <Sider collapsible theme="dark" className="app-sidebar">
        <div className="app-brand">
          <WalletOutlined />
          <span>Meu Financeiro</span>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[currentPage]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => setCurrentPage(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <span>{currentItem?.label}</span>
        </Header>
        <Content className="app-content">
          {renderPage()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;

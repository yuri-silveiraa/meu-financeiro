import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  SwapOutlined,
  PlusOutlined,
  CreditCardOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

export default function BottomNav({ onOpenMenu, onNewTransaction }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bottom-nav" aria-label="Navegação inferior mobile">
      <button
        type="button"
        className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
        aria-label="Ir para Dashboard"
      >
        <DashboardOutlined className="bottom-nav-icon" />
        <span className="bottom-nav-label">Início</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${isActive('/transacoes') ? 'active' : ''}`}
        onClick={() => navigate('/transacoes')}
        aria-label="Ir para Transações"
      >
        <SwapOutlined className="bottom-nav-icon" />
        <span className="bottom-nav-label">Extrato</span>
      </button>

      <div className="bottom-nav-fab-container">
        <button
          type="button"
          className="bottom-nav-fab"
          onClick={onNewTransaction}
          aria-label="Criar nova transação"
          title="Nova Transação"
        >
          <PlusOutlined />
        </button>
      </div>

      <button
        type="button"
        className={`bottom-nav-item ${isActive('/cartoes') ? 'active' : ''}`}
        onClick={() => navigate('/cartoes')}
        aria-label="Ir para Cartões"
      >
        <CreditCardOutlined className="bottom-nav-icon" />
        <span className="bottom-nav-label">Cartões</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${['/gastosfixos', '/relatorios', '/metas', '/configuracoes'].includes(location.pathname) ? 'active' : ''}`}
        onClick={onOpenMenu}
        aria-label="Abrir menu de mais opções"
      >
        <AppstoreOutlined className="bottom-nav-icon" />
        <span className="bottom-nav-label">Mais</span>
      </button>
    </nav>
  );
}

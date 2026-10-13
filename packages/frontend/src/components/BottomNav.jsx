import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  SwapOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const navItems = [
  { path: '/', label: 'Início', icon: DashboardOutlined },
  { path: '/transacoes', label: 'Transações', icon: SwapOutlined },
  { path: '/cartoes', label: 'Cartões', icon: CreditCardOutlined },
  { path: '/gastosfixos', label: 'Fixos', icon: CalendarOutlined },
  { path: '/configuracoes', label: 'Ajustes', icon: SettingOutlined },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Navegação inferior mobile">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={`Ir para ${item.label}`}
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

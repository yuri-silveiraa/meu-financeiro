import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import { getMonthName } from '../../../utils/date';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesMonthNav() {
  const { mes, ano, irParaMesAnterior, irParaProximoMes } = useTransacoes();

  const nomeMes = getMonthName(mes - 1);

  return (
    <div className="transacoes-month-nav">
      <button
        type="button"
        className="nav-arrow"
        onClick={irParaMesAnterior}
        aria-label="Mês anterior"
        title="Mês anterior"
      >
        ‹
      </button>

      <div className="month-display-pill" title={`Mês selecionado: ${nomeMes} de ${ano}`}>
        <CalendarOutlined style={{ marginRight: 6, fontSize: 14, opacity: 0.8 }} />
        <span className="month-text">{nomeMes} / {ano}</span>
      </div>

      <button
        type="button"
        className="nav-arrow"
        onClick={irParaProximoMes}
        aria-label="Próximo mês"
        title="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}

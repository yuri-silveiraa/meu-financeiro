import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesSummary() {
  const { totalReceitas, totalDespesasPagas, saldoAtual, saldoProjetado } = useTransacoes();

  return (
    <div className="stats-grid finance-summary">
      <div className="stat-card receita">
        <div className="stat-header">
          <span className="stat-label">Receitas pagas</span>
          <span className="stat-indicator positive">↑</span>
        </div>
        <div className="stat-value positive">{formatCurrency(totalReceitas)}</div>
      </div>
      <div className="stat-card despesa">
        <div className="stat-header">
          <span className="stat-label">Despesas pagas</span>
          <span className="stat-indicator negative">↓</span>
        </div>
        <div className="stat-value negative">{formatCurrency(totalDespesasPagas)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Saldo atual</span>
          <span className="stat-indicator neutral">⚡</span>
        </div>
        <div className={`stat-value ${saldoAtual >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(saldoAtual)}
        </div>
      </div>
      <div className="stat-card saldo">
        <div className="stat-header">
          <span className="stat-label">Saldo projetado</span>
          <span className="stat-indicator saldo">📊</span>
        </div>
        <div className={`stat-value ${saldoProjetado >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(saldoProjetado)}
        </div>
        <div className="stat-note">Inclui despesas abertas</div>
      </div>
    </div>
  );
}

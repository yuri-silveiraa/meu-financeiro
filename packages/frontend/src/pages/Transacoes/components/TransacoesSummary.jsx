import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { StatCardSkeleton } from '../../../components/Skeleton';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesSummary() {
  const { totalReceitas, totalDespesasPagas, saldoAtual, saldoProjetado, loading, filteredTransacoes } = useTransacoes();

  if (loading && filteredTransacoes.length === 0) {
    return <StatCardSkeleton count={4} className="stats-grid finance-summary" />;
  }

  return (
    <div className="stats-grid finance-summary">
      <div className="stat-card receita">
        <div className="stat-header">
          <span className="stat-label">Receitas recebidas</span>
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

      <div className="stat-card saldo-atual">
        <div className="stat-header">
          <span className="stat-label">Saldo atual</span>
          <span className="stat-indicator neutral">⚡</span>
        </div>
        <div className={`stat-value ${saldoAtual >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(saldoAtual)}
        </div>
      </div>

      <div className="stat-card saldo-projetado">
        <div className="stat-header">
          <span className="stat-label">Saldo projetado</span>
          <span className="stat-indicator saldo">📊</span>
        </div>
        <div className={`stat-value ${saldoProjetado >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(saldoProjetado)}
        </div>
      </div>
    </div>
  );
}

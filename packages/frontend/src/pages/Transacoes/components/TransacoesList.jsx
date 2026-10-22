import React from 'react';
import { CheckCircleOutlined, UndoOutlined } from '@ant-design/icons';
import TransactionCard from '../../../components/TransactionCard';
import EmptyState from '../../../components/EmptyState';
import { TransactionCardSkeleton } from '../../../components/Skeleton';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesList() {
  const {
    filteredTransacoes,
    loading,
    pendentesCount,
    hasPendentes,
    handleToggleAllPago,
    openCreateModal,
    handleTogglePago,
    handleEdit,
  } = useTransacoes();

  if (loading && filteredTransacoes.length === 0) {
    return (
      <div className="transaction-list">
        <TransactionCardSkeleton count={5} />
      </div>
    );
  }

  return (
    <div
      className="transaction-list"
      style={{ opacity: loading ? 0.65 : 1, transition: 'opacity 0.2s ease' }}
    >
      {filteredTransacoes.length === 0 ? (
        <EmptyState
          icon="💳"
          title="Nenhuma transação encontrada"
          description="Registre sua primeira receita ou despesa para começar."
          onAction={openCreateModal}
          actionLabel="Nova Transação"
        />
      ) : (
        <>
          <div className="transacoes-list-subheader">
            <span className="transacoes-count-info">
              {filteredTransacoes.length} {filteredTransacoes.length === 1 ? 'transação' : 'transações'}
              {pendentesCount > 0 ? (
                <span className="badge-pendentes"> · {pendentesCount}  pagar/receber</span>
              ) : (
                <span className="badge-todas-concluidas"> · ✓ Todas concluídas</span>
              )}
            </span>
            <button
              type="button"
              className={`btn-sub-toggle-all ${hasPendentes ? 'is-pendente' : 'is-concluida'}`}
              onClick={handleToggleAllPago}
              title={
                hasPendentes
                  ? 'Marcar todas como pagas/recebidas'
                  : 'Desmarcar todas (tornar pendentes)'
              }
            >
              {hasPendentes ? <CheckCircleOutlined /> : <UndoOutlined />}
              <span>{hasPendentes ? 'Marcar todas como pagas' : 'Desmarcar todas'}</span>
            </button>
          </div>

          {filteredTransacoes.map((transacao) => (
            <TransactionCard
              key={transacao.id}
              transaction={transacao}
              onTogglePago={handleTogglePago}
              onEdit={handleEdit}
            />
          ))}
        </>
      )}
    </div>
  );
}

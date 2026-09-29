import React from 'react';
import TransactionCard from '../../../components/TransactionCard';
import EmptyState from '../../../components/EmptyState';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesList() {
  const {
    filteredTransacoes,
    loading,
    openCreateModal,
    handleTogglePago,
    handleEdit,
  } = useTransacoes();

  return (
    <div className="transaction-list">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
          Carregando...
        </div>
      ) : filteredTransacoes.length === 0 ? (
        <EmptyState
          icon="💳"
          title="Nenhuma transação encontrada"
          description="Registre sua primeira receita ou despesa para começar."
          onAction={openCreateModal}
          actionLabel="Nova Transação"
        />
      ) : (
        filteredTransacoes.map((transacao) => (
          <TransactionCard
            key={transacao.id}
            transaction={transacao}
            onTogglePago={handleTogglePago}
            onEdit={handleEdit}
          />
        ))
      )}
    </div>
  );
}

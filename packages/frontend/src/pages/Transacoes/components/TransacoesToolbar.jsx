import React from 'react';
import { PlusOutlined, CheckCircleOutlined, UndoOutlined } from '@ant-design/icons';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesToolbar() {
  const {
    openCreateModal,
    loading,
    filteredTransacoes,
    hasPendentes,
    handleToggleAllPago,
  } = useTransacoes();

  return (
    <div className="transacoes-top-action">
      <button
        type="button"
        className="btn-primary btn-nova-transacao"
        onClick={openCreateModal}
        disabled={loading}
      >
        <PlusOutlined /> Nova Transação
      </button>

      {filteredTransacoes.length > 0 && (
        <button
          type="button"
          className={`btn-marcar-todas ${hasPendentes ? 'pago' : 'aberto'}`}
          onClick={handleToggleAllPago}
          disabled={loading}
          title={
            hasPendentes
              ? 'Marcar todas as transações como pagas/recebidas de uma só vez'
              : 'Desmarcar todas (tornar pendentes)'
          }
        >
          {hasPendentes ? <CheckCircleOutlined /> : <UndoOutlined />}
          <span>{hasPendentes ? 'Marcar todas como pagas' : 'Desmarcar todas'}</span>
        </button>
      )}
    </div>
  );
}

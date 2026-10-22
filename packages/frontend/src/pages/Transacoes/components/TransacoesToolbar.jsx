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
    </div>
  );
}

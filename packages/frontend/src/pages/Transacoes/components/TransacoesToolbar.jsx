import React from 'react';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesToolbar() {
  const { openCreateModal, handleImportCSV, loading } = useTransacoes();

  return (
    <div className="workspace-header">
      <div>
        <h1 className="page-title">Transações</h1>
        <p className="page-subtitle">Controle entradas, saídas e pendências.</p>
      </div>
      <div className="toolbar">
        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
          <UploadOutlined /> CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            style={{ display: 'none' }}
          />
        </label>
        <button className="btn-primary" onClick={openCreateModal} disabled={loading}>
          <PlusOutlined /> Nova
        </button>
      </div>
    </div>
  );
}

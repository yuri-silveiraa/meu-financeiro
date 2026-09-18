import { useState } from 'react';
import { Avatar, Tag, Space } from 'antd';
import { formatCurrency } from '../utils/currency';
import { downwardArrow } from '../utils/date';

const TransactionCard = ({ transaction, onTogglePago, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    if (onDelete) onDelete(transaction.id);
  };

  const handleTogglePago = () => {
    if (onTogglePago) onTogglePago(transaction.id);
  };

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: '#fff',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.2s',
        overflow: 'hidden',
      }}
      onMouseOver={() => setExpanded(true)}
      onMouseOut={() => setExpanded(false)}
    >
      <div
        style={{
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {downwardArrow(transaction.data)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {transaction.descricao || '-'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Tag
            color={transaction.tipo === 'receita' ? '#16a34a' : '#ef4444'}
            size="small"
          >
            {transaction.tipo === 'receita' ? 'Receita' : 'Despesa'}
          </Tag>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {transaction.tipo_pagamento || '-'}
          </span>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            padding: 8,
            borderTop: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              Categoria: {transaction.categoria_nome || 'Sem categoria'}
            </span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              Conta: {transaction.conta_nome || 'N/A'}
            </span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>Valor: {formatCurrency(transaction.valor)}</span>
            <span>Pago: {transaction.pago ? 'Sim' : 'Não'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
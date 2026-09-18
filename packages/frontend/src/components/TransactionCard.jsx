import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
};

const TransactionCard = ({ transaction, onTogglePago, onEdit, onDelete }) => {
  const meta = [
    transaction.categoria_nome,
    transaction.tipo_pagamento,
    formatDate(transaction.data),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="tx-card">
      <div className="tx-card-left">
        <span
          className="tx-dot"
          style={{ background: transaction.categoria_cor || '#6b7280' }}
        />
        <div className="tx-info">
          <span className="tx-desc">{transaction.descricao || 'Sem descrição'}</span>
          {meta && <span className="tx-meta">{meta}</span>}
        </div>
      </div>
      <div className="tx-card-right">
        <span className={`tx-valor ${transaction.tipo}`}>
          {transaction.tipo === 'receita' ? '+' : '-'}
          {formatCurrency(transaction.valor)}
        </span>
        <div className="tx-actions">
          <button
            type="button"
            className={`status-toggle ${transaction.pago ? 'is-paid' : 'is-open'}`}
            onClick={() => onTogglePago?.(transaction.id)}
          >
            {transaction.pago ? '✓ Pago' : 'Aberto'}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => onEdit?.(transaction)}
            aria-label="Editar"
          >
            <EditOutlined />
          </button>
          <button
            type="button"
            className="icon-button danger"
            onClick={() => onDelete?.(transaction.id)}
            aria-label="Excluir"
          >
            <DeleteOutlined />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
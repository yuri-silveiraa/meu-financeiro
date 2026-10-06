import React from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';

const formatDate = (value) => {
  if (!value) return '';
  const parts = value.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return new Date(value).toLocaleDateString('pt-BR');
};

/**
 * Card component for a fixed expense (gasto fixo).
 * Mirrors the UI of TransactionCard but adapts the fields to the
 * fixed‑expense model returned by the backend.
 */
const GastoFixoCard = ({ gasto, onEdit, onDelete }) => {
  const dataFormatada = formatDate(gasto.data);
  const accentColor = gasto.categoria_cor || (gasto.tipo === 'receita' ? '#22c55e' : '#ef4444');

  return (
    <div
      className="tx-card"
      onClick={() => onEdit?.(gasto)}
      role="button"
      tabIndex={0}
      style={{ '--tx-accent-color': accentColor }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onEdit?.(gasto);
        }
      }}
    >
      <div className="tx-card-left">
        <span className="tx-accent-bar" style={{ background: accentColor }} />
        <div className="tx-info">
          <span className="tx-desc" title={gasto.nome || 'Sem descrição'}>
            {gasto.nome || 'Sem descrição'}
          </span>
          <div className="tx-subinfo">
            {gasto.categoria_nome && (
              <span className="tx-cat-tag">
                <span
                  className="tx-dot-mini"
                  style={{ background: gasto.categoria_cor || '#6b7280' }}
                />
                {gasto.categoria_nome}
              </span>
            )}
            {gasto.cartao_nome ? (
              <span className="tx-badge-card">
                💳 {gasto.cartao_nome}
                {gasto.total_parcelas > 1 ? ` (${gasto.parcela_atual}/${gasto.total_parcelas})` : ''}
              </span>
            ) : gasto.conta_nome ? (
              <span className="tx-badge-account">
                🏦 {gasto.conta_nome}
              </span>
            ) : null}
            {dataFormatada && <span className="tx-date">{dataFormatada}</span>}
          </div>
        </div>
      </div>
      <div className="tx-card-right">
        <span className={`tx-valor ${gasto.tipo}`}> {gasto.tipo === 'receita' ? '+' : '-'} {formatCurrency(gasto.valor)} </span>
        {onDelete && (
          <button
            type="button"
            className="icon-button danger"
            title="Excluir item fixo"
            aria-label="Excluir item fixo"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(gasto.id);
            }}
          >
            <DeleteOutlined />
          </button>
        )}
      </div>
    </div>
  );
};

export default GastoFixoCard;

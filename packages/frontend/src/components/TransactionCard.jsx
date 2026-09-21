import { formatCurrency } from '../utils/currency';

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
};

const TransactionCard = ({ transaction, onTogglePago, onEdit }) => {
  const isPaid = !!transaction.pago;
  const isReceita = transaction.tipo === 'receita';
  const dataFormatada = formatDate(transaction.data);

  return (
    <div
      className={`tx-card ${isPaid ? 'tx-card-paid' : 'tx-card-unpaid'}`}
      onClick={() => onEdit?.(transaction)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onEdit?.(transaction);
        }
      }}
    >
      <div className="tx-card-left">
        <div className="tx-info">
          <span className="tx-desc" title={transaction.descricao || 'Sem descrição'}>
            {transaction.descricao || 'Sem descrição'}
          </span>
          <div className="tx-subinfo">
            {transaction.categoria_nome && (
              <span className="tx-cat-tag">
                <span
                  className="tx-dot-mini"
                  style={{ background: transaction.categoria_cor || '#6b7280' }}
                />
                {transaction.categoria_nome}
              </span>
            )}
            {transaction.cartao_nome && (
              <span className="tx-cat-tag" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                💳 {transaction.cartao_nome}
                {transaction.total_parcelas > 1 ? ` (${transaction.parcela_atual}/${transaction.total_parcelas})` : ''}
              </span>
            )}
            {dataFormatada && <span className="tx-date">{dataFormatada}</span>}
          </div>
        </div>
      </div>

      <div className="tx-card-right">
        <span className={`tx-valor ${transaction.tipo}`}>
          {isReceita ? '+' : '-'} {formatCurrency(transaction.valor)}
        </span>
        <button
          type="button"
          className={`status-pill ${isPaid ? 'is-paid' : 'is-unpaid'}`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePago?.(transaction.id);
          }}
          title={isPaid ? 'Clique para marcar como pendente' : 'Clique para marcar como pago'}
        >
          {isPaid ? '✓ Pago' : '⏳ Pendente'}
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;
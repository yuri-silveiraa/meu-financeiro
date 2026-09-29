import React from 'react';
import { Progress, Button, Tooltip, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../utils/currency';
import { useCartoes } from '../CartoesContext';

export default function CreditCardItem({ cartao }) {
  const { selectedCartaoId, setSelectedCartaoId, handleOpenModalCartao, handleDeleteCartao } = useCartoes();
  const percentUsado = cartao.limite > 0
    ? Math.min(100, Math.round((cartao.limite_comprometido / cartao.limite) * 100))
    : 0;
  const isSelected = cartao.id === selectedCartaoId;
  const cardColor = cartao.cor || '#6366f1';

  return (
    <div
      className={`credit-card-item ${isSelected ? 'is-selected' : 'is-unselected'}`}
      onClick={() => setSelectedCartaoId(cartao.id)}
      style={{
        background: `linear-gradient(135deg, ${cardColor} 0%, #0a0e1c 115%)`,
        '--card-neon-color': cardColor,
      }}
    >
      {/* Topo do Cartão: Chip EMV, Aproximação & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="card-emv-chip" title="Chip de Segurança EMV" />
          <span className="card-nfc-icon" title="Pagamento por Aproximação">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a8.5 8.5 0 0 0 0-14" />
              <path d="M15.5 21.5a12 12 0 0 0 0-19" />
            </svg>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="card-neon-badge"
            style={{
              opacity: isSelected ? 1 : 0,
              pointerEvents: 'none',
              transition: 'opacity 0.2s ease',
            }}
          >
            <CheckOutlined style={{ fontSize: 10 }} /> Ativo
          </span>
          <span className="card-brand-badge">
            {cartao.bandeira || 'Crédito'}
          </span>
        </div>
      </div>

      {/* Nome do Cartão */}
      <div style={{ zIndex: 1, marginTop: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.03em', textShadow: '0 2px 4px rgba(0,0,0,0.6)', color: '#ffffff' }}>
          {cartao.nome}
        </div>
      </div>

      {/* Limite Disponível */}
      <div style={{ zIndex: 1, marginTop: 6 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Limite Disponível
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.5)', marginTop: 2 }}>
          {formatCurrency(cartao.limite_disponivel)}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          de {formatCurrency(cartao.limite)} total
        </div>
      </div>

      {/* Barra de Progresso com Glow */}
      <div style={{ zIndex: 1, marginTop: 8 }}>
        <Progress
          percent={percentUsado}
          size="small"
          showInfo={false}
          strokeColor={percentUsado > 85 ? '#ef4444' : (percentUsado > 60 ? '#f59e0b' : '#38bdf8')}
          trailColor="rgba(255, 255, 255, 0.2)"
        />
      </div>

      {/* Datas de Fechamento e Vencimento */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'rgba(255,255,255,0.9)', zIndex: 1, marginTop: 8 }}>
        <span>Fecha dia <b>{cartao.dia_fechamento}</b></span>
        <span>Vence dia <b>{cartao.dia_vencimento}</b></span>
      </div>

      {/* Ações (Editar e Excluir) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 8, zIndex: 1 }}>
        <Tooltip title="Editar Cartão">
          <Button
            type="text"
            size="small"
            className="card-action-btn"
            icon={<EditOutlined style={{ color: '#ffffff' }} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModalCartao(cartao);
            }}
          />
        </Tooltip>
        <Popconfirm
          title="Excluir Cartão"
          description="As transações desvincularão deste cartão. Deseja continuar?"
          onConfirm={(e) => {
            e.stopPropagation();
            handleDeleteCartao(cartao.id);
          }}
          onCancel={(e) => e.stopPropagation()}
        >
          <Button
            type="text"
            size="small"
            className="card-action-btn"
            icon={<DeleteOutlined style={{ color: '#fca5a5' }} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </div>
    </div>
  );
}

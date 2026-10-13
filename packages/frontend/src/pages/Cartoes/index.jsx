import React from 'react';
import { Row, Col, Button, Typography, Spin } from 'antd';
import { CreditCardOutlined, PlusOutlined } from '@ant-design/icons';
import EmptyState from '../../components/EmptyState';
import { CartoesProvider, useCartoes } from './CartoesContext';
import CreditCardItem from './components/CreditCardItem';
import FaturasSection from './components/FaturasSection';
import ModalCartao from './components/ModalCartao';
import ModalPagarFatura from './components/ModalPagarFatura';

const { Title, Text } = Typography;

function CartoesContent() {
  const { cartoes, loading, handleOpenModalCartao } = useCartoes();

  return (
    <div className="workspace" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="transacoes-top-action">
        <button
          type="button"
          className="btn-primary btn-nova-transacao"
          onClick={() => handleOpenModalCartao()}
        >
          <PlusOutlined /> Novo Cartão
        </button>
      </div>

      {loading && cartoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : cartoes.length === 0 ? (
        <EmptyState
          title="Nenhum cartão cadastrado"
          description="Cadastre seu primeiro cartão de crédito para acompanhar faturas e limites em tempo real."
          actionText="Cadastrar Cartão"
          onAction={() => handleOpenModalCartao()}
        />
      ) : (
        <>
          {/* CARDS VISUAIS DE CARTÕES */}
          <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
            {cartoes.map((cartao) => (
              <Col xs={24} sm={12} md={8} lg={6} key={cartao.id}>
                <CreditCardItem cartao={cartao} />
              </Col>
            ))}
          </Row>

          {/* VISÃO DE FATURAS DO CARTÃO SELECIONADO */}
          <FaturasSection />
        </>
      )}

      {/* MODAIS */}
      <ModalCartao />
      <ModalPagarFatura />
    </div>
  );
}

export default function Cartoes() {
  return (
    <CartoesProvider>
      <CartoesContent />
    </CartoesProvider>
  );
}

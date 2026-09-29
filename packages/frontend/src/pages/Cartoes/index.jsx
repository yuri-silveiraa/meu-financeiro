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
    <div style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <CreditCardOutlined style={{ marginRight: 8, color: '#6366f1' }} />
            Cartões de Crédito
          </Title>
          <Text type="secondary">Gerencie limites, faturas e compras parceladas em dias úteis</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModalCartao()}>
          Novo Cartão
        </Button>
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

import React from 'react';
import { Card, Spin, Alert, Row, Col, Typography, Tag, Button, Table } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../utils/currency';
import { getMonthName, formatDataBr } from '../../../utils/date';
import { useTheme } from '../../../contexts/ThemeContext';
import EmptyState from '../../../components/EmptyState';
import { useCartoes } from '../CartoesContext';

const { Title, Text } = Typography;

export default function FaturasSection() {
  const { isDark } = useTheme();
  const {
    selectedCard,
    faturas,
    faturaDetalhada,
    loadingFaturas,
    handleSelectFatura,
    handleOpenPagarModal,
  } = useCartoes();

  if (!selectedCard) return null;

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ color: selectedCard.cor || '#6366f1' }} />
          <span>Faturas de <b>{selectedCard.nome}</b></span>
        </div>
      }
      style={{ borderRadius: 12 }}
    >
      <div style={{ minHeight: 420, position: 'relative' }}>
        <Spin spinning={loadingFaturas} tip="Carregando faturas..." size="large">
          {faturas.length === 0 && !loadingFaturas ? (
            <Alert
              type="info"
              message="Nenhuma fatura registrada"
              description="Lance compras informando a forma de pagamento Crédito e este cartão para ver suas faturas e parcelas aqui."
              showIcon
            />
          ) : (
            <Row gutter={[24, 24]}>
              {/* Seletor de Faturas */}
              <Col xs={24} md={8}>
                <Title level={5} style={{ marginBottom: 12 }}>Histórico de Faturas</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {faturas.map((f) => {
                    const isCurrentActive =
                      faturaDetalhada &&
                      faturaDetalhada.fatura_ano === f.fatura_ano &&
                      faturaDetalhada.fatura_mes === f.fatura_mes;

                    return (
                      <div
                        key={`${f.fatura_ano}-${f.fatura_mes}`}
                        onClick={() => handleSelectFatura(f)}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          cursor: 'pointer',
                          border: isCurrentActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isCurrentActive ? (isDark ? 'rgba(59, 130, 246, 0.16)' : '#eff6ff') : 'var(--bg-card-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            {getMonthName(f.fatura_mes - 1)} / {f.fatura_ano}
                          </div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Vence: {formatDataBr(f.data_vencimento)}
                          </Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', color: f.pago ? '#10b981' : '#ef4444' }}>
                            {formatCurrency(f.total)}
                          </div>
                          {f.pago ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>Paga</Tag>
                          ) : (
                            <Tag color="warning" icon={<ClockCircleOutlined />}>Aberta</Tag>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Col>

              {/* Detalhes da Fatura Selecionada */}
              <Col xs={24} md={16}>
                {faturaDetalhada ? (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        padding: '14px 18px',
                        background: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 10,
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <Title level={4} style={{ margin: 0 }}>
                          Fatura de {getMonthName(faturaDetalhada.fatura_mes - 1)} / {faturaDetalhada.fatura_ano}
                        </Title>
                        <Text type="secondary">
                          Vencimento em dia útil: <b>{formatDataBr(faturaDetalhada.data_vencimento)}</b>
                        </Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>Total da Fatura</Text>
                          <div style={{ fontSize: 22, fontWeight: 'bold', color: faturaDetalhada.pago ? '#059669' : '#dc2626' }}>
                            {formatCurrency(faturaDetalhada.total)}
                          </div>
                        </div>
                        {!faturaDetalhada.pago && (
                          <Button
                            type="primary"
                            icon={<DollarOutlined />}
                            onClick={() => handleOpenPagarModal(faturaDetalhada)}
                            style={{ background: '#10b981', borderColor: '#10b981' }}
                          >
                            Pagar Fatura
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Tabela de lançamentos da fatura */}
                    <Table
                      size="small"
                      dataSource={faturaDetalhada.transacoes || []}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: 'Data',
                          dataIndex: 'data',
                          key: 'data',
                          render: (val) => formatDataBr(val),
                          width: 105,
                        },
                        {
                          title: 'Descrição',
                          dataIndex: 'descricao',
                          key: 'descricao',
                          render: (val, record) => (
                            <div>
                              <span>{val || 'Sem descrição'}</span>
                              {record.total_parcelas > 1 && (
                                <Tag color="purple" style={{ marginLeft: 6 }}>
                                  {record.parcela_atual}/{record.total_parcelas}
                                </Tag>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: 'Categoria',
                          dataIndex: 'categoria_nome',
                          key: 'categoria_nome',
                          render: (val, record) =>
                            val ? (
                              <Tag color={record.categoria_cor || 'blue'}>{val}</Tag>
                            ) : (
                              <Text type="secondary">-</Text>
                            ),
                        },
                        {
                          title: 'Valor',
                          dataIndex: 'valor',
                          key: 'valor',
                          align: 'right',
                          render: (val) => (
                            <span style={{ fontWeight: 600, color: '#dc2626' }}>
                              {formatCurrency(val)}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </div>
                ) : (
                  <EmptyState description="Selecione uma fatura para ver os detalhes." />
                )}
              </Col>
            </Row>
          )}
        </Spin>
      </div>
    </Card>
  );
}

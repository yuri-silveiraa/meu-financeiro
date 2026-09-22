import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Progress,
  Tag,
  Typography,
  Space,
  Table,
  Popconfirm,
  message,
  Spin,
  Alert,
  Tooltip,
} from 'antd';
import {
  CreditCardOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { getMonthName } from '../utils/date';
import { useTheme } from '../contexts/ThemeContext';
import EmptyState from '../components/EmptyState';

const { Title, Text } = Typography;
const { Option } = Select;

const BANDEIRAS = [
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'visa', label: 'Visa' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'American Express' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'nubank', label: 'Nubank' },
  { value: 'inter', label: 'Inter' },
  { value: 'outro', label: 'Outro' },
];

const PRESET_CORES = [
  '#6366f1', '#820ad1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#1e293b'
];

const ColorSelect = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
    {PRESET_CORES.map((cor) => {
      const isSelected = value === cor;
      return (
        <button
          key={cor}
          type="button"
          onClick={() => onChange?.(cor)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: cor,
            cursor: 'pointer',
            border: isSelected ? '3px solid #111827' : '2px solid transparent',
            boxShadow: isSelected ? '0 0 0 2px #fff inset, 0 2px 6px rgba(0,0,0,0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            padding: 0,
          }}
        >
          {isSelected && '✓'}
        </button>
      );
    })}
  </div>
);

function formatDataBr(dataStr) {
  if (!dataStr) return '-';
  const parts = String(dataStr).split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataStr;
}

export default function Cartoes() {
  const { isDark } = useTheme();
  const [cartoes, setCartoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [selectedCartaoId, setSelectedCartaoId] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [faturaDetalhada, setFaturaDetalhada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFaturas, setLoadingFaturas] = useState(false);

  // Modais
  const [isModalCartaoOpen, setIsModalCartaoOpen] = useState(false);
  const [editingCartao, setEditingCartao] = useState(null);
  const [formCartao] = Form.useForm();

  const [isModalPagarOpen, setIsModalPagarOpen] = useState(false);
  const [faturaParaPagar, setFaturaParaPagar] = useState(null);
  const [formPagar] = Form.useForm();
  const [payingLoading, setPayingLoading] = useState(false);

  const loadCartoes = useCallback(async () => {
    setLoading(true);
    try {
      const [cartoesData, contasData] = await Promise.all([
        api.getCartoes(),
        api.getContas(),
      ]);
      setCartoes(cartoesData);
      setContas(contasData);

      if (cartoesData.length > 0) {
        setSelectedCartaoId((prev) => {
          const stillExists = cartoesData.some((c) => c.id === prev);
          return stillExists ? prev : cartoesData[0].id;
        });
      } else {
        setSelectedCartaoId(null);
        setFaturas([]);
        setFaturaDetalhada(null);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Erro ao carregar cartões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartoes();
  }, [loadCartoes]);

  // Carregar faturas do cartão selecionado
  const loadFaturas = useCallback(async (cartaoId) => {
    if (!cartaoId) return;
    setLoadingFaturas(true);
    try {
      const data = await api.getFaturas(cartaoId);
      setFaturas(data);

      // Carregar a fatura do mês atual ou a fatura aberta mais próxima cronologicamente
      if (data.length > 0) {
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1;

        const faturaMesAtual = data.find((f) => f.fatura_ano === anoAtual && f.fatura_mes === mesAtual);
        const faturaAberta = faturaMesAtual || [...data].reverse().find((f) => !f.pago) || data[0];
        const detalhe = await api.getFaturaDetalhada(cartaoId, faturaAberta.fatura_ano, faturaAberta.fatura_mes);
        setFaturaDetalhada(detalhe);
      } else {
        setFaturaDetalhada(null);
      }
    } catch (err) {
      console.error(err);
      message.error('Erro ao carregar faturas');
    } finally {
      setLoadingFaturas(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCartaoId) {
      loadFaturas(selectedCartaoId);
    }
  }, [selectedCartaoId, loadFaturas]);

  const handleSelectFatura = async (fatura) => {
    try {
      setLoadingFaturas(true);
      const detalhe = await api.getFaturaDetalhada(selectedCartaoId, fatura.fatura_ano, fatura.fatura_mes);
      setFaturaDetalhada(detalhe);
    } catch (err) {
      console.error(err);
      message.error('Erro ao carregar detalhes da fatura');
    } finally {
      setLoadingFaturas(false);
    }
  };

  // Abrir modal novo/editar cartão
  const handleOpenModalCartao = (cartao = null) => {
    setEditingCartao(cartao);
    if (cartao) {
      formCartao.setFieldsValue({
        nome: cartao.nome,
        bandeira: cartao.bandeira || 'mastercard',
        limite: cartao.limite,
        dia_fechamento: cartao.dia_fechamento,
        dia_vencimento: cartao.dia_vencimento,
        conta_padrao_id: cartao.conta_padrao_id,
        cor: cartao.cor || '#6366f1',
      });
    } else {
      formCartao.resetFields();
      formCartao.setFieldsValue({
        bandeira: 'mastercard',
        limite: 1000,
        dia_fechamento: 25,
        dia_vencimento: 5,
        cor: '#6366f1',
      });
    }
    setIsModalCartaoOpen(true);
  };

  const handleSaveCartao = async () => {
    try {
      const values = await formCartao.validateFields();
      if (editingCartao) {
        await api.updateCartao(editingCartao.id, values);
        message.success('Cartão atualizado com sucesso!');
      } else {
        const novo = await api.addCartao(values);
        message.success('Cartão criado com sucesso!');
        setSelectedCartaoId(novo.id);
      }
      setIsModalCartaoOpen(false);
      loadCartoes();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || 'Erro ao salvar cartão');
    }
  };

  const handleDeleteCartao = async (id) => {
    try {
      await api.deleteCartao(id);
      message.success('Cartão removido com sucesso!');
      loadCartoes();
    } catch (err) {
      message.error(err.message || 'Erro ao remover cartão');
    }
  };

  // Pagar Fatura
  const handleOpenPagarModal = (fatura) => {
    setFaturaParaPagar(fatura);
    const cartaoAtual = cartoes.find((c) => c.id === selectedCartaoId);
    formPagar.setFieldsValue({
      conta_id: cartaoAtual?.conta_padrao_id || (contas.length > 0 ? contas[0].id : null),
    });
    setIsModalPagarOpen(true);
  };

  const handleConfirmPagar = async () => {
    try {
      const values = await formPagar.validateFields();
      setPayingLoading(true);
      await api.pagarFatura(selectedCartaoId, faturaParaPagar.fatura_ano, faturaParaPagar.fatura_mes, {
        conta_id: values.conta_id,
      });
      message.success('Fatura liquidada com sucesso!');
      setIsModalPagarOpen(false);
      loadCartoes();
      loadFaturas(selectedCartaoId);
    } catch (err) {
      message.error(err.message || 'Erro ao pagar fatura');
    } finally {
      setPayingLoading(false);
    }
  };

  const selectedCard = cartoes.find((c) => c.id === selectedCartaoId);

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
            {cartoes.map((cartao) => {
              const percentUsado = cartao.limite > 0
                ? Math.min(100, Math.round((cartao.limite_comprometido / cartao.limite) * 100))
                : 0;
              const isSelected = cartao.id === selectedCartaoId;
              const cardColor = cartao.cor || '#6366f1';

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={cartao.id}>
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
                </Col>
              );
            })}
          </Row>

          {/* VISÃO DE FATURAS DO CARTÃO SELECIONADO */}
          {selectedCard && (
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
          )}
        </>
      )}

      {/* MODAL NOVO/EDITAR CARTÃO */}
      <Modal
        title={editingCartao ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
        open={isModalCartaoOpen}
        onOk={handleSaveCartao}
        onCancel={() => setIsModalCartaoOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form
          form={formCartao}
          layout="vertical"
          initialValues={{
            bandeira: 'mastercard',
            cor: '#6366f1',
            dia_fechamento: 25,
            dia_vencimento: 5,
            limite: 1000,
          }}
        >
          <Form.Item
            name="nome"
            label="Nome do Cartão"
            rules={[{ required: true, message: 'Informe o nome do cartão' }]}
          >
            <Input placeholder="Ex: Nubank, C6 Carbon, Itaú Click" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bandeira" label="Bandeira">
                <Select placeholder="Selecione">
                  {BANDEIRAS.map((b) => (
                    <Option key={b.value} value={b.value}>
                      {b.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="limite"
                label="Limite Total (R$)"
                rules={[{ required: true, message: 'Informe o limite' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="Ex: 5000.00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dia_fechamento"
                label="Dia de Fechamento"
                rules={[{ required: true, message: 'Informe o dia' }]}
                tooltip="Dia em que a fatura fecha para novas compras"
              >
                <InputNumber min={1} max={31} style={{ width: '100%' }} placeholder="Ex: 25" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dia_vencimento"
                label="Dia de Vencimento"
                rules={[{ required: true, message: 'Informe o dia' }]}
                tooltip="Dia base de vencimento (se cair no fim de semana ou feriado, posterga para o dia útil)"
              >
                <InputNumber min={1} max={31} style={{ width: '100%' }} placeholder="Ex: 5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="conta_padrao_id"
            label="Conta Bancária Padrão para Débito (Opcional)"
            tooltip="Conta usada como sugestão ao pagar a fatura"
          >
            <Select placeholder="Selecione uma conta bancária" allowClear>
              {contas.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.nome} {c.banco ? `(${c.banco})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="cor" label="Cor do Cartão">
            <ColorSelect />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL PAGAR FATURA */}
      <Modal
        title="Liquidação de Fatura de Cartão"
        open={isModalPagarOpen}
        onOk={handleConfirmPagar}
        confirmLoading={payingLoading}
        onCancel={() => setIsModalPagarOpen(false)}
        okText="Confirmar Pagamento"
        cancelText="Cancelar"
        destroyOnClose
      >
        {faturaParaPagar && (
          <div>
            <Alert
              type="info"
              message={`Pagamento da Fatura ${getMonthName(faturaParaPagar.fatura_mes - 1)}/${faturaParaPagar.fatura_ano}`}
              description={
                <div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                    Valor: {formatCurrency(faturaParaPagar.total)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Ao confirmar, todos os lançamentos desta fatura serão marcados como pagos e o limite do cartão será liberado.
                  </div>
                </div>
              }
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={formPagar} layout="vertical">
              <Form.Item
                name="conta_id"
                label="Debitar da Conta Bancária"
                rules={[{ required: true, message: 'Selecione a conta de débito' }]}
              >
                <Select placeholder="Selecione a conta de débito">
                  {contas.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.nome} {c.banco ? `(${c.banco})` : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

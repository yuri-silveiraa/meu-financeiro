import React from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col } from 'antd';
import { BANDEIRAS } from '../constants';
import ColorSelect from './ColorSelect';
import { useCartoes } from '../CartoesContext';

const { Option } = Select;

export default function ModalCartao() {
  const {
    isModalCartaoOpen,
    setIsModalCartaoOpen,
    editingCartao,
    formCartao,
    contas,
    handleSaveCartao,
  } = useCartoes();

  return (
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
  );
}

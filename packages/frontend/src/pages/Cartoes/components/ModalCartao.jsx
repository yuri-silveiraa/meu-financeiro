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
      title={editingCartao ? 'Editar Cartão' : 'Novo Cartão'}
      open={isModalCartaoOpen}
      onOk={handleSaveCartao}
      onCancel={() => setIsModalCartaoOpen(false)}
      okText="Salvar"
      cancelText="Cancelar"
      destroyOnClose
      width={460}
      className="modern-form-modal"
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
        style={{ paddingTop: 4 }}
      >
        <Form.Item
          name="nome"
          label={<span className="form-label-compact">Nome do Cartão</span>}
          rules={[{ required: true, message: 'Informe o nome do cartão' }]}
          style={{ marginBottom: 10 }}
        >
          <Input placeholder="Ex: Nubank, C6, Itaú..." className="form-input-compact" />
        </Form.Item>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item
              name="bandeira"
              label={<span className="form-label-compact">Bandeira</span>}
              style={{ marginBottom: 10 }}
            >
              <Select placeholder="Selecione" className="form-select-compact">
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
              label={<span className="form-label-compact">Limite Total (R$)</span>}
              rules={[{ required: true, message: 'Informe o limite' }]}
              style={{ marginBottom: 10 }}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%', height: 38 }}
                placeholder="Ex: 5000.00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item
              name="dia_fechamento"
              label={<span className="form-label-compact">Dia Fechamento</span>}
              rules={[{ required: true, message: 'Informe o dia' }]}
              tooltip="Dia em que a fatura fecha"
              style={{ marginBottom: 10 }}
            >
              <InputNumber min={1} max={31} style={{ width: '100%', height: 38 }} placeholder="Ex: 25" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dia_vencimento"
              label={<span className="form-label-compact">Dia Vencimento</span>}
              rules={[{ required: true, message: 'Informe o dia' }]}
              tooltip="Dia do vencimento"
              style={{ marginBottom: 10 }}
            >
              <InputNumber min={1} max={31} style={{ width: '100%', height: 38 }} placeholder="Ex: 5" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="conta_padrao_id"
          label={<span className="form-label-compact">Conta Débito Padrão (Opcional)</span>}
          style={{ marginBottom: 10 }}
        >
          <Select placeholder="Selecione a conta..." allowClear className="form-select-compact">
            {contas.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.nome} {c.banco ? `(${c.banco})` : ''}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="cor"
          label={<span className="form-label-compact">Cor do Cartão</span>}
          style={{ marginBottom: 0 }}
        >
          <ColorSelect />
        </Form.Item>
      </Form>
    </Modal>
  );
}

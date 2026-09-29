import React from 'react';
import { Modal, Form, Select, Alert } from 'antd';
import { formatCurrency } from '../../../utils/currency';
import { getMonthName } from '../../../utils/date';
import { useCartoes } from '../CartoesContext';

const { Option } = Select;

export default function ModalPagarFatura() {
  const {
    isModalPagarOpen,
    setIsModalPagarOpen,
    handleConfirmPagar,
    payingLoading,
    faturaParaPagar,
    formPagar,
    contas,
  } = useCartoes();

  return (
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
  );
}

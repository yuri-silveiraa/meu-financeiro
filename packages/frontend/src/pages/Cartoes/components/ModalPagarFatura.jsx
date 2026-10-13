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
      title="Pagar Fatura"
      open={isModalPagarOpen}
      onOk={handleConfirmPagar}
      confirmLoading={payingLoading}
      onCancel={() => setIsModalPagarOpen(false)}
      okText="Confirmar Pagamento"
      cancelText="Cancelar"
      destroyOnClose
      width={440}
      className="modern-form-modal"
    >
      {faturaParaPagar && (
        <div style={{ paddingTop: 4 }}>
          <Alert
            type="info"
            message={`Fatura ${getMonthName(faturaParaPagar.fatura_mes - 1)}/${faturaParaPagar.fatura_ano}`}
            description={
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold', marginTop: 2, color: 'var(--text-primary)' }}>
                  Valor: {formatCurrency(faturaParaPagar.total)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Ao confirmar, os lançamentos serão marcados como pagos e o limite liberado.
                </div>
              </div>
            }
            showIcon
            style={{ marginBottom: 12, padding: '8px 12px' }}
          />

          <Form form={formPagar} layout="vertical">
            <Form.Item
              name="conta_id"
              label={<span className="form-label-compact">Debitar da Conta</span>}
              rules={[{ required: true, message: 'Selecione a conta' }]}
              style={{ marginBottom: 0 }}
            >
              <Select placeholder="Selecione a conta de débito..." className="form-select-compact">
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

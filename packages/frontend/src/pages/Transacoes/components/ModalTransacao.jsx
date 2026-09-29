import React from 'react';
import { Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../../utils/currency';
import { useTransacoes } from '../TransacoesContext';

export default function ModalTransacao() {
  const {
    showModal,
    setShowModal,
    editando,
    form,
    setForm,
    categorias,
    contas,
    cartoes,
    handleSubmit,
    handleDelete,
    resetForm,
  } = useTransacoes();

  return (
    <Modal
      open={showModal}
      onCancel={() => {
        setShowModal(false);
        resetForm();
      }}
      title={editando ? 'Editar Transação' : 'Nova Transação'}
      footer={null}
      width={600}
      destroyOnHide
    >
      <form onSubmit={handleSubmit} style={{ paddingTop: 8 }}>
        <div className="form-grid two-columns">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) =>
                setForm({
                  ...form,
                  tipo: e.target.value,
                  tipo_pagamento: e.target.value === 'receita' ? '' : 'debito',
                })
              }
              className="form-select"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Valor</label>
            <input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Data</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              className="form-select"
            >
              <option value="">Selecione...</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descrição</label>
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="form-input"
          />
        </div>

        {form.tipo === 'despesa' && (
          <>
            <div className="form-grid two-columns">
              <div className="form-group">
                <label className="form-label">Tipo de Pagamento</label>
                <select
                  value={form.tipo_pagamento}
                  onChange={(e) => setForm({ ...form, tipo_pagamento: e.target.value })}
                  className="form-select"
                >
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={form.pago}
                  onChange={(e) => setForm({ ...form, pago: e.target.checked })}
                />
                <span>Marcar como pago</span>
              </label>
            </div>

            {form.tipo_pagamento === 'credito' && (
              <div className="form-grid two-columns">
                <div className="form-group">
                  <label className="form-label">Cartão de Crédito</label>
                  <select
                    value={form.cartao_id}
                    onChange={(e) => setForm({ ...form, cartao_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Selecione o cartão...</option>
                    {cartoes.map((cartao) => (
                      <option key={cartao.id} value={cartao.id}>
                        {cartao.nome} (Fecha: {cartao.dia_fechamento} / Vence: {cartao.dia_vencimento})
                      </option>
                    ))}
                  </select>
                </div>

                {!editando ? (
                  <div className="form-group">
                    <label className="form-label">Parcelamento</label>
                    <select
                      value={form.total_parcelas}
                      onChange={(e) => setForm({ ...form, total_parcelas: parseInt(e.target.value, 10) })}
                      className="form-select"
                    >
                      <option value={1}>À vista (1x)</option>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((num) => (
                        <option key={num} value={num}>
                          {num}x {form.valor ? `de ${formatCurrency(parseFloat(form.valor) / num)}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Parcela</label>
                    <input
                      type="text"
                      disabled
                      value={`${form.parcela_atual || 1}/${form.total_parcelas || 1}`}
                      className="form-input"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label className="form-label">
            Conta {form.tipo_pagamento === 'credito' ? '(Opcional)' : ''}
          </label>
          <select
            value={form.conta_id}
            onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
            className="form-select"
          >
            <option value="">Selecione...</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </div>

        <div
          className="modal-actions"
          style={{ justifyContent: editando ? 'space-between' : 'flex-end' }}
        >
          {editando && (
            <button
              type="button"
              className="btn-ghost danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => handleDelete(editando.id)}
            >
              <DeleteOutlined /> Excluir Transação
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

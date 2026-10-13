import React from 'react';
import { Modal } from 'antd';
import { DeleteOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
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

  const handleTipoChange = (novoTipo) => {
    setForm({
      ...form,
      tipo: novoTipo,
      tipo_pagamento: novoTipo === 'receita' ? '' : (form.tipo_pagamento || 'debito'),
    });
  };

  return (
    <Modal
      open={showModal}
      onCancel={() => {
        setShowModal(false);
        resetForm();
      }}
      title={editando ? 'Editar Transação' : 'Nova Transação'}
      footer={null}
      width={460}
      destroyOnHide
      className="modern-form-modal"
    >
      <form onSubmit={handleSubmit} className="modern-form">
        {/* Toggle Despesa / Receita */}
        <div className="type-toggle-pill">
          <button
            type="button"
            className={`type-toggle-opt despesa ${form.tipo === 'despesa' ? 'active' : ''}`}
            onClick={() => handleTipoChange('despesa')}
          >
            <ArrowDownOutlined style={{ fontSize: 11 }} /> Despesa
          </button>
          <button
            type="button"
            className={`type-toggle-opt receita ${form.tipo === 'receita' ? 'active' : ''}`}
            onClick={() => handleTipoChange('receita')}
          >
            <ArrowUpOutlined style={{ fontSize: 11 }} /> Receita
          </button>
        </div>

        {/* Valor Compacto e Elegante */}
        <div className={`amount-row ${form.tipo}`}>
          <span className="amount-currency">R$</span>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            className="amount-input"
            required
            autoFocus={!editando}
          />
        </div>

        {/* Campos em layout compacto e harmonioso */}
        <div className="form-fields-compact">
          <div className="form-group-compact">
            <label className="form-label-compact">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Almoço, Supermercado..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="form-input-compact"
            />
          </div>

          <div className="form-row-compact">
            <div className="form-group-compact">
              <label className="form-label-compact">Categoria</label>
              <select
                value={form.categoria_id || ''}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                className="form-select-compact"
              >
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-compact">
              <label className="form-label-compact">Data</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                className="form-input-compact"
                required
              />
            </div>
          </div>

          {form.tipo === 'despesa' ? (
            <>
              <div className="form-row-compact">
                <div className="form-group-compact">
                  <label className="form-label-compact">Pagamento</label>
                  <select
                    value={form.tipo_pagamento || 'debito'}
                    onChange={(e) => setForm({ ...form, tipo_pagamento: e.target.value })}
                    className="form-select-compact"
                  >
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="pix">Pix</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>

                <div className="form-group-compact">
                  <label className="form-label-compact">
                    Conta {form.tipo_pagamento === 'credito' ? '(Opcional)' : ''}
                  </label>
                  <select
                    value={form.conta_id || ''}
                    onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
                    className="form-select-compact"
                  >
                    <option value="">Selecione...</option>
                    {contas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.tipo_pagamento === 'credito' && (
                <div className="form-row-compact">
                  <div className="form-group-compact">
                    <label className="form-label-compact">Cartão</label>
                    <select
                      value={form.cartao_id || ''}
                      onChange={(e) => setForm({ ...form, cartao_id: e.target.value })}
                      className="form-select-compact"
                    >
                      <option value="">Selecione...</option>
                      {cartoes.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!editando ? (
                    <div className="form-group-compact">
                      <label className="form-label-compact">Parcelas</label>
                      <select
                        value={form.total_parcelas}
                        onChange={(e) => setForm({ ...form, total_parcelas: parseInt(e.target.value, 10) })}
                        className="form-select-compact"
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
                    <div className="form-group-compact">
                      <label className="form-label-compact">Parcela</label>
                      <input
                        type="text"
                        disabled
                        value={`${form.parcela_atual || 1}/${form.total_parcelas || 1}`}
                        className="form-input-compact"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="form-group-compact">
              <label className="form-label-compact">Conta para Depósito</label>
              <select
                value={form.conta_id || ''}
                onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
                className="form-select-compact"
              >
                <option value="">Selecione...</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Rodapé Fixo Compacto */}
        <div
          className="modal-actions"
          style={{ justifyContent: editando ? 'space-between' : 'flex-end' }}
        >
          {editando && (
            <button
              type="button"
              className="btn-ghost danger"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={() => handleDelete(editando.id)}
            >
              <DeleteOutlined /> Excluir
            </button>
          )}
          <div style={{ display: 'flex', gap: 8, width: editando ? 'auto' : '100%' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
            >
              Salvar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

import React from 'react';
import { Modal } from 'antd';
import { useTransacoes } from '../TransacoesContext';

export default function ModalFiltros() {
  const {
    showFilterModal,
    setShowFilterModal,
    filtros,
    setFiltros,
    categorias,
    contas,
    cartoes,
    clearFilters,
  } = useTransacoes();

  return (
    <Modal
      open={showFilterModal}
      onCancel={() => setShowFilterModal(false)}
      title="Filtrar Transações"
      footer={null}
      width={440}
      destroyOnHide
      className="modern-form-modal"
    >
      <div className="modern-form">
        <div className="form-fields-compact">
          <div className="form-row-compact">
            <div className="form-group-compact">
              <label className="form-label-compact">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="form-input-compact"
              />
            </div>
            <div className="form-group-compact">
              <label className="form-label-compact">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="form-input-compact"
              />
            </div>
          </div>

          <div className="form-row-compact">
            <div className="form-group-compact">
              <label className="form-label-compact">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="form-select-compact"
              >
                <option value="">Todos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
            <div className="form-group-compact">
              <label className="form-label-compact">Status</label>
              <select
                value={filtros.pago}
                onChange={(e) => setFiltros({ ...filtros, pago: e.target.value })}
                className="form-select-compact"
              >
                <option value="">Todos</option>
                <option value="1">Recebidas / Pagas</option>
                <option value="0">Pendentes</option>
              </select>
            </div>
          </div>

          <div className="form-row-compact">
            <div className="form-group-compact">
              <label className="form-label-compact">Categoria</label>
              <select
                value={filtros.categoriaId}
                onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
                className="form-select-compact"
              >
                <option value="">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-compact">
              <label className="form-label-compact">Conta</label>
              <select
                value={filtros.contaId}
                onChange={(e) => setFiltros({ ...filtros, contaId: e.target.value })}
                className="form-select-compact"
              >
                <option value="">Todas</option>
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group-compact">
            <label className="form-label-compact">Cartão de Crédito</label>
            <select
              value={filtros.cartaoId}
              onChange={(e) => {
                const newCardId = e.target.value;
                setFiltros((prev) => ({
                  ...prev,
                  cartaoId: newCardId,
                  ...(newCardId ? { dataInicio: '', dataFim: '' } : {}),
                }));
              }}
              className="form-select-compact"
            >
              <option value="">Todos os cartões</option>
              {cartoes.map((cartao) => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                clearFilters();
                setShowFilterModal(false);
              }}
              style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
            >
              Limpar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowFilterModal(false)}
              style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

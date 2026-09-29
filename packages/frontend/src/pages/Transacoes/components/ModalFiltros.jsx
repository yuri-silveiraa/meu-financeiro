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
      width={480}
      destroyOnHide
    >
      <div className="filter-modal-content">
        <div className="form-grid two-columns">
          <div className="form-group">
            <label className="form-label">Data Início</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Data Fim</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid two-columns">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="form-select"
            >
              <option value="">Todos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              value={filtros.pago}
              onChange={(e) => setFiltros({ ...filtros, pago: e.target.value })}
              className="form-select"
            >
              <option value="">Todos</option>
              <option value="1">Pagas</option>
              <option value="0">Pendentes</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select
            value={filtros.categoriaId}
            onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
            className="form-select"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Conta</label>
          <select
            value={filtros.contaId}
            onChange={(e) => setFiltros({ ...filtros, contaId: e.target.value })}
            className="form-select"
          >
            <option value="">Todas as contas</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Cartão de Crédito</label>
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
            className="form-select"
          >
            <option value="">Todos os cartões</option>
            {cartoes.map((cartao) => (
              <option key={cartao.id} value={cartao.id}>
                {cartao.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              clearFilters();
              setShowFilterModal(false);
            }}
          >
            Limpar Filtros
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowFilterModal(false)}
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </Modal>
  );
}

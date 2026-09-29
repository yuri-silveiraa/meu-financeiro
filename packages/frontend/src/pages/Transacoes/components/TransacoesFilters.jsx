import React from 'react';
import { Badge } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useTransacoes } from '../TransacoesContext';

export default function TransacoesFilters() {
  const {
    quickSearch,
    setQuickSearch,
    filtros,
    setFiltros,
    categorias,
    contas,
    cartoes,
    clearFilters,
    activeFiltersCount,
    setShowFilterModal,
  } = useTransacoes();

  return (
    <>
      {/* Barra de Filtros para Desktop */}
      <div className="filters-bar compact desktop-filters-bar">
        <input
          type="search"
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          className="form-input search-input"
          placeholder="Buscar descrição, categoria, conta..."
        />
        <input
          type="date"
          value={filtros.dataInicio}
          onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
          className="form-input"
          title="Data inicial"
        />
        <input
          type="date"
          value={filtros.dataFim}
          onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
          className="form-input"
          title="Data final"
        />
        <select
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
          className="form-select"
        >
          <option value="">Todos os tipos</option>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
        <select
          value={filtros.pago}
          onChange={(e) => setFiltros({ ...filtros, pago: e.target.value })}
          className="form-select"
        >
          <option value="">Todos os status</option>
          <option value="1">Pagas</option>
          <option value="0">Abertas</option>
        </select>
        <select
          value={filtros.categoriaId}
          onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
          className="form-select"
        >
          <option value="">Todas categorias</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
        <select
          value={filtros.contaId}
          onChange={(e) => setFiltros({ ...filtros, contaId: e.target.value })}
          className="form-select"
        >
          <option value="">Todas contas</option>
          {contas.map((conta) => (
            <option key={conta.id} value={conta.id}>
              {conta.nome}
            </option>
          ))}
        </select>
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
          <option value="">Todos cartões</option>
          {cartoes.map((cartao) => (
            <option key={cartao.id} value={cartao.id}>
              {cartao.nome}
            </option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={clearFilters}>
          Limpar
        </button>
      </div>

      {/* Barra Simplificada para Mobile */}
      <div className="mobile-search-filter-row">
        <input
          type="search"
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          className="form-input search-input"
          placeholder="Buscar transação..."
        />
        <button
          type="button"
          className="btn-secondary filter-btn-mobile"
          onClick={() => setShowFilterModal(true)}
        >
          <Badge count={activeFiltersCount} offset={[6, -2]} size="small">
            <FilterOutlined style={{ fontSize: 16 }} />
          </Badge>
          <span>Filtros</span>
        </button>
      </div>
    </>
  );
}

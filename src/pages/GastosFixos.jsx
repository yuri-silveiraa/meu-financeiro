import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import FinanceGrid from '../components/FinanceGrid';
import { formatCurrency } from '../utils/currency';

const initialForm = () => ({
  nome: '',
  valor: '',
  dia_vencimento: '1',
  tipo_pagamento: 'pix',
  categoria_id: ''
});

function GastosFixos() {
  const [gastosFixos, setGastosFixos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gf, c] = await Promise.all([
        window.api.getGastosFixos(),
        window.api.getCategorias()
      ]);
      setGastosFixos(gf);
      setCategorias(c);
    } catch (err) {
      setError(err.message || 'Erro ao carregar gastos fixos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(initialForm());
  };

  const openCreateModal = () => {
    resetForm();
    setEditando(null);
    setShowModal(true);
  };

  const handleEdit = useCallback((gasto) => {
    setEditando(gasto);
    setForm({
      nome: gasto.nome,
      valor: gasto.valor.toString(),
      dia_vencimento: gasto.dia_vencimento.toString(),
      tipo_pagamento: gasto.tipo_pagamento || 'pix',
      categoria_id: gasto.categoria_id || ''
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (confirm('Tem certeza que deseja excluir? As transações já criadas permanecerão.')) {
      await window.api.deleteGastoFixo(id);
      loadData();
    }
  }, [loadData]);

  const columnDefs = useMemo(() => [
    {
      field: 'nome',
      headerName: 'Nome',
      flex: 1.6,
      minWidth: 220,
      pinned: 'left'
    },
    {
      field: 'valor',
      headerName: 'Valor mensal',
      width: 144,
      type: 'rightAligned',
      cellClass: 'money-cell expense',
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'dia_vencimento',
      headerName: 'Vencimento',
      width: 126,
      valueFormatter: (params) => `Dia ${params.value}`
    },
    {
      field: 'tipo_pagamento',
      headerName: 'Pagamento',
      width: 136,
      cellRenderer: (params) => {
        if (!params.value) return <span className="muted-cell">-</span>;
        return <span className={`tipo-badge ${params.value}`}>{params.value}</span>;
      }
    },
    {
      field: 'categoria_nome',
      headerName: 'Categoria',
      flex: 1,
      minWidth: 160,
      cellRenderer: (params) => {
        if (!params.value) return <span className="muted-cell">Sem categoria</span>;
        return (
          <span className="category-chip" style={{ '--chip-color': params.data.categoria_cor || '#6b7280' }}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Ações',
      width: 112,
      minWidth: 112,
      pinned: 'right',
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="grid-row-actions">
          <button type="button" className="icon-button" aria-label="Editar" onClick={() => handleEdit(params.data)}>
            <EditOutlined />
          </button>
          <button type="button" className="icon-button danger" aria-label="Excluir" onClick={() => handleDelete(params.data.id)}>
            <DeleteOutlined />
          </button>
        </div>
      )
    }
  ], [handleDelete, handleEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dados = {
      ...form,
      valor: parseFloat(form.valor),
      dia_vencimento: parseInt(form.dia_vencimento, 10)
    };

    if (editando) {
      await window.api.updateGastoFixo({ ...dados, id: editando.id });
    } else {
      const result = await window.api.addGastoFixo(dados);
      alert(`Gasto fixo criado! ${result.transacoesCriadas} transações geradas para os próximos meses.`);
    }

    setShowModal(false);
    setEditando(null);
    resetForm();
    loadData();
  };

  const totalMensal = gastosFixos.reduce((sum, gasto) => sum + gasto.valor, 0);
  const proximoVencimento = gastosFixos.length
    ? Math.min(...gastosFixos.map((gasto) => gasto.dia_vencimento))
    : null;

  return (
    <div className="workspace">
      {error && <div className="alert-error">{error}</div>}

      <div className="workspace-header">
        <div>
          <h1 className="page-title">Gastos Fixos</h1>
          <p className="page-subtitle">Despesas recorrentes mensais e previsibilidade do caixa.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} disabled={loading}>
          <PlusOutlined /> Novo Gasto Fixo
        </button>
      </div>

      <div className="stats-grid compact-summary">
        <div className="stat-card despesa">
          <div className="stat-label">Total mensal</div>
          <div className="stat-value negative">{formatCurrency(totalMensal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quantidade</div>
          <div className="stat-value">{gastosFixos.length}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-label">Próximo vencimento</div>
          <div className="stat-value">{proximoVencimento ? `Dia ${proximoVencimento}` : '-'}</div>
        </div>
      </div>

      <div className="workspace-panel">
        <div className="filters-bar compact">
          <input
            type="search"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="form-input search-input"
            placeholder="Buscar gasto fixo, categoria, pagamento..."
          />
        </div>

        <FinanceGrid
          storageKey="finance-grid:gastos-fixos"
          rowData={gastosFixos}
          columnDefs={columnDefs}
          loading={loading}
          quickFilterText={quickSearch}
          height={460}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal finance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editando ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Internet, Aluguel, Netflix"
                  required
                />
              </div>
              <div className="form-grid two-columns">
                <div className="form-group">
                  <label className="form-label">Valor Mensal</label>
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
                  <label className="form-label">Dia do Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.dia_vencimento}
                    onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-grid two-columns">
                <div className="form-group">
                  <label className="form-label">Tipo de Pagamento</label>
                  <select
                    value={form.tipo_pagamento}
                    onChange={(e) => setForm({ ...form, tipo_pagamento: e.target.value })}
                    className="form-select"
                  >
                    <option value="pix">Pix</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="boleto">Boleto</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
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
                      <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GastosFixos;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import FinanceGrid from '../components/FinanceGrid';
import { formatCurrency } from '../utils/currency';

const initialForm = () => ({
  nome: '',
  valor: '',
  dia_vencimento: '1',
  tipo: 'despesa',
  tipo_pagamento: 'pix',
  categoria_id: '',
  conta_id: '',
  total_parcelas: ''
});

function GastosFixos() {
  const [gastosFixos, setGastosFixos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('despesa');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gf, c, ct] = await Promise.all([
        window.api.getGastosFixos(),
        window.api.getCategorias(),
        window.api.getContas()
      ]);
      setGastosFixos(gf);
      setCategorias(c);
      setContas(ct);
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
    setForm((prev) => ({ ...prev, tipo: abaAtiva === 'todos' ? 'despesa' : abaAtiva }));
    setEditando(null);
    setShowModal(true);
  };

  const handleEdit = useCallback((gasto) => {
    setEditando(gasto);
    setForm({
      nome: gasto.nome,
      valor: gasto.valor.toString(),
      dia_vencimento: gasto.dia_vencimento.toString(),
      tipo: gasto.tipo || 'despesa',
      tipo_pagamento: gasto.tipo_pagamento || 'pix',
      categoria_id: gasto.categoria_id || '',
      conta_id: gasto.conta_id || '',
      total_parcelas: gasto.total_parcelas?.toString() || ''
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (confirm('Tem certeza que deseja excluir? As transações já criadas permanecerão.')) {
      await window.api.deleteGastoFixo(id);
      loadData();
    }
  }, [loadData]);

  const gastosFiltrados = useMemo(() => {
    if (abaAtiva === 'todos') return gastosFixos;
    return gastosFixos.filter((g) => g.tipo === abaAtiva);
  }, [gastosFixos, abaAtiva]);

  const columnDefs = useMemo(() => {
    const cols = [
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
        cellClass: (params) => `money-cell ${params.data?.tipo === 'receita' ? 'income' : 'expense'}`,
        valueFormatter: (params) => formatCurrency(params.value)
      },
      {
        field: 'dia_vencimento',
        headerName: 'Vencimento',
        width: 126,
        valueFormatter: (params) => `Dia ${params.value}`
      },
      {
        field: 'total_parcelas',
        headerName: 'Parcelas',
        width: 120,
        cellRenderer: (params) => {
          if (!params.value) return <span className="muted-cell">Recorrente</span>;
          return <span>{params.value}x</span>;
        }
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
        field: 'conta_nome',
        headerName: 'Conta',
        width: 140,
        valueFormatter: (params) => params.value || '-'
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
    ];

    if (abaAtiva === 'todos') {
      cols.splice(1, 0, {
        field: 'tipo',
        headerName: 'Tipo',
        width: 110,
        cellRenderer: (params) => (
          <span className={`money-type ${params.value}`}>
            {params.value === 'receita' ? 'Receita' : 'Despesa'}
          </span>
        )
      });
    }

    return cols;
  }, [handleDelete, handleEdit, abaAtiva]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dados = {
      ...form,
      valor: parseFloat(form.valor),
      dia_vencimento: parseInt(form.dia_vencimento, 10),
      tipo: form.tipo || 'despesa',
      total_parcelas: form.total_parcelas ? parseInt(form.total_parcelas, 10) : null,
      conta_id: form.conta_id || null
    };

    if (editando) {
      await window.api.updateGastoFixo({ ...dados, id: editando.id });
    } else {
      const result = await window.api.addGastoFixo(dados);
      const label = dados.tipo === 'receita' ? 'Receita fixa' : 'Gasto fixo';
      alert(`${label} criado(a)! ${result.transacoesCriadas} transações geradas para os próximos meses.`);
    }

    setShowModal(false);
    setEditando(null);
    resetForm();
    loadData();
  };

  const totalDespesas = gastosFixos.filter((g) => g.tipo === 'despesa').reduce((sum, g) => sum + g.valor, 0);
  const totalReceitas = gastosFixos.filter((g) => g.tipo === 'receita').reduce((sum, g) => sum + g.valor, 0);
  const saldoFixo = totalReceitas - totalDespesas;

  const proximoVencimento = gastosFiltrados.length
    ? Math.min(...gastosFiltrados.map((g) => g.dia_vencimento))
    : null;

  const botaoLabel = {
    despesa: 'Novo Gasto Fixo',
    receita: 'Nova Receita Fixa',
    todos: 'Novo Item'
  };

  const placeholderNome = {
    despesa: 'Ex: Internet, Aluguel, Netflix',
    receita: 'Ex: Salário, Freelance, Aluguel recebido',
    todos: 'Ex: Internet, Salário, Netflix'
  };

  return (
    <div className="workspace">
      {error && <div className="alert-error">{error}</div>}

      <div className="workspace-header">
        <div>
          <h1 className="page-title">Receitas e Despesas Fixas</h1>
          <p className="page-subtitle">Controle seus compromissos fixos e previsibilidade do caixa.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} disabled={loading}>
          <PlusOutlined /> {botaoLabel[abaAtiva]}
        </button>
      </div>

      <div className="filter-tabs">
        {[
          { key: 'despesa', label: 'Despesas' },
          { key: 'receita', label: 'Receitas' },
          { key: 'todos', label: 'Todos' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`filter-tab ${abaAtiva === tab.key ? 'active' : ''}`}
            onClick={() => setAbaAtiva(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="stats-grid compact-summary stats-split">
        <div className="stat-card despesa">
          <div className="stat-label">Total Despesas</div>
          <div className="stat-value negative">{formatCurrency(totalDespesas)}</div>
        </div>
        <div className="stat-card receita">
          <div className="stat-label">Total Receitas</div>
          <div className="stat-value positive">{formatCurrency(totalReceitas)}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-label">Saldo Fixo</div>
          <div className={`stat-value ${saldoFixo >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(saldoFixo)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quantidade</div>
          <div className="stat-value">{gastosFiltrados.length}</div>
        </div>
        <div className="stat-card">
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
            placeholder="Buscar item fixo, categoria, pagamento..."
          />
        </div>

        <FinanceGrid
          storageKey="finance-grid:gastos-fixos"
          rowData={gastosFiltrados}
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
              <h2 className="modal-title">
                {editando
                  ? (editando.tipo === 'receita' ? 'Editar Receita Fixa' : 'Editar Gasto Fixo')
                  : (form.tipo === 'receita' ? 'Nova Receita Fixa' : 'Novo Gasto Fixo')}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="form-input"
                  placeholder={placeholderNome[form.tipo || abaAtiva]}
                  required
                />
              </div>
              <div className="form-grid three-columns">
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
                <div className="form-group">
                  <label className="form-label">Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    value={form.total_parcelas}
                    onChange={(e) => setForm({ ...form, total_parcelas: e.target.value })}
                    className="form-input"
                    placeholder="Recorrente"
                  />
                  <span className="form-hint">Vazio = recorrente para sempre</span>
                </div>
              </div>
              <div className="form-grid three-columns">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="form-select"
                  >
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                </div>
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
              <div className="form-group">
                <label className="form-label">Conta</label>
                <select
                  value={form.conta_id}
                  onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Nenhuma conta</option>
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.id}>{conta.nome}</option>
                  ))}
                </select>
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

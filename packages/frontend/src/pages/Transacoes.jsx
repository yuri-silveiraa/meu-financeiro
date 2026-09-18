import { useCallback, useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { validateTransacao } from '../utils/validation';
import { api } from '../services/api';
import TransactionCard from '../components/TransactionCard';

const initialForm = () => ({
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: '',
  tipo: 'despesa',
  tipo_pagamento: 'debito',
  categoria_id: '',
  conta_id: '',
  pago: false
});

const formatInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentMonthRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    dataInicio: formatInputDate(firstDay),
    dataFim: formatInputDate(lastDay)
  };
};

const initialFilters = () => ({
  ...getCurrentMonthRange(),
  tipo: '',
  pago: '',
  categoriaId: '',
  contaId: ''
});

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
};

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtros, setFiltros] = useState(initialFilters);
  const [quickSearch, setQuickSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, c, ct] = await Promise.all([
        api.getTransacoes(filtros),
        api.getCategorias(),
        api.getContas()
      ]);
      setTransacoes(t);
      setCategorias(c);
      setContas(ct);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePago = useCallback(async (id) => {
    try {
      await api.togglePago(id);
      loadData();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      setError('Erro ao alterar status de pagamento');
    }
  }, [loadData]);

  const resetForm = () => {
    setForm(initialForm());
  };

  const openCreateModal = () => {
    resetForm();
    setEditando(null);
    setShowModal(true);
  };

  const handleEdit = useCallback((transacao) => {
    setEditando(transacao);
    setForm({
      data: transacao.data,
      descricao: transacao.descricao || '',
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      tipo_pagamento: transacao.tipo_pagamento || '',
      categoria_id: transacao.categoria_id || '',
      conta_id: transacao.conta_id || '',
      pago: transacao.pago === 1
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await api.deleteTransacao(id);
        loadData();
      } catch (err) {
        console.error('Erro ao excluir transação:', err);
        setError('Erro ao excluir transação');
      }
    }
  }, [loadData]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateTransacao(form);
    if (Object.keys(errors).length > 0) {
      alert(Object.values(errors)[0]);
      return;
    }

    const dados = {
      ...form,
      valor: parseFloat(form.valor),
      pago: form.tipo === 'receita' ? true : form.pago
    };

    try {
      if (editando) {
        await api.updateTransacao(editando.id, dados);
      } else {
        await api.addTransacao(dados);
      }

      setShowModal(false);
      setEditando(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      setError('Erro ao salvar transação');
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const transacoesImportadas = results.data.map(row => ({
          data: row.data || row.Data || new Date().toISOString().split('T')[0],
          descricao: row.descricao || row.Descricao || row.description || '',
          valor: Math.abs(parseFloat(row.valor || row.Valor || row.value || 0)),
          tipo: parseFloat(row.valor || row.Valor || row.value) > 0 ? 'receita' : 'despesa',
          tipo_pagamento: (row.tipo_pagamento || row.tipo || 'debito').toLowerCase(),
          descricao_lower: (row.descricao || row.Descricao || '').toLowerCase(),
          pago: parseFloat(row.valor || row.Valor || row.value) > 0 ? true : false
        })).map(transacao => {
          const categoria = categorias.find(c => transacao.descricao_lower.includes(c.nome.toLowerCase()));
          return { ...transacao, categoria_id: categoria?.id || null };
        });

        let importadas = 0;
        let erros = 0;
        for (const transacao of transacoesImportadas) {
          try {
            await api.addTransacao(transacao);
            importadas++;
          } catch (err) {
            console.error('Erro ao importar transação:', err);
            erros++;
          }
        }

        loadData();
        const msg = `Importadas ${importadas} transações` + (erros > 0 ? ` (${erros} erros)` : '');
        alert(msg);
      }
    });
    e.target.value = '';
  };

  const clearFilters = () => {
    setFiltros(initialFilters());
    setQuickSearch('');
  };

  const updateSelectedPaidStatus = async (selectedRows, pago, clearSelection) => {
    try {
      await Promise.all(selectedRows.map((transacao) => (
        api.updateTransacao(transacao.id, { ...transacao, pago })
      )));
      clearSelection();
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar transações:', err);
      setError('Erro ao atualizar transações selecionadas');
    }
  };

  const deleteSelectedRows = async (selectedRows, clearSelection) => {
    const plural = selectedRows.length > 1 ? 'transações selecionadas' : 'transação selecionada';
    if (!confirm(`Tem certeza que deseja excluir ${selectedRows.length} ${plural}?`)) return;

    try {
      await Promise.all(selectedRows.map((transacao) => api.deleteTransacao(transacao.id)));
      clearSelection();
      loadData();
    } catch (err) {
      console.error('Erro ao excluir transações:', err);
      setError('Erro ao excluir transações selecionadas');
    }
  };

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita' && t.pago).reduce((sum, t) => sum + parseFloat(t.valor), 0);
  const totalDespesasPagas = transacoes.filter(t => t.tipo === 'despesa' && t.pago).reduce((sum, t) => sum + parseFloat(t.valor), 0);
  const totalDespesasNaoPagas = transacoes.filter(t => t.tipo === 'despesa' && !t.pago).reduce((sum, t) => sum + parseFloat(t.valor), 0);
  const saldoAtual = totalReceitas - totalDespesasPagas;
  const saldoProjetado = totalReceitas - totalDespesasPagas - totalDespesasNaoPagas;

  return (
    <div className="workspace">
      {error && <div className="alert-error">{error}</div>}

      <div className="workspace-header">
        <div>
          <h1 className="page-title">Transações</h1>
          <p className="page-subtitle">Controle entradas, saídas e pendências com filtros salvos no grid.</p>
        </div>
        <div className="toolbar">
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <UploadOutlined /> CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn-primary" onClick={openCreateModal} disabled={loading}>
            <PlusOutlined /> Nova
          </button>
        </div>
      </div>

      <div className="stats-grid finance-summary">
        <div className="stat-card receita">
          <div className="stat-label">Receitas pagas</div>
          <div className="stat-value positive">{formatCurrency(totalReceitas)}</div>
        </div>
        <div className="stat-card despesa">
          <div className="stat-label">Despesas pagas</div>
          <div className="stat-value negative">{formatCurrency(totalDespesasPagas)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saldo atual</div>
          <div className={`stat-value ${saldoAtual >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(saldoAtual)}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-label">Saldo projetado</div>
          <div className={`stat-value ${saldoProjetado >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(saldoProjetado)}</div>
          <div className="stat-note">Inclui despesas abertas</div>
        </div>
      </div>

      <div className="workspace-panel">
        <div className="filters-bar compact">
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
          />
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            className="form-input"
          />
          <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })} className="form-select">
            <option value="">Todos os tipos</option>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
          </select>
          <select value={filtros.pago} onChange={(e) => setFiltros({ ...filtros, pago: e.target.value })} className="form-select">
            <option value="">Todos os status</option>
            <option value="1">Pagas</option>
            <option value="0">Abertas</option>
          </select>
          <select value={filtros.categoriaId} onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })} className="form-select">
            <option value="">Todas categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
          <select value={filtros.contaId} onChange={(e) => setFiltros({ ...filtros, contaId: e.target.value })} className="form-select">
            <option value="">Todas contas</option>
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>{conta.nome}</option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={clearFilters}>Limpar</button>
        </div>

        <div className="transaction-list">
          {transacoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
              Nenhuma transação encontrada
            </div>
          ) : (
            <div style={{ overflow: 'auto', '-webkit-overflow-scrolling': 'touch' }}>
              {transacoes.map((transacao) => (
                <TransactionCard key={transacao.id} transaction={transacao} />
              ))}
            </div>
          )}
        </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal finance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editando ? 'Editar Transação' : 'Nova Transação'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid two-columns">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value, tipo_pagamento: e.target.value === 'receita' ? '' : 'debito' })}
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
                      <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
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
              )}

              <div className="form-group">
                <label className="form-label">Conta</label>
                <select
                  value={form.conta_id}
                  onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Selecione...</option>
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

export default Transacoes;

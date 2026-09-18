import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { Modal, message } from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { validateTransacao } from '../utils/validation';
import { api } from '../services/api';
import TransactionCard from '../components/TransactionCard';
import EmptyState from '../components/EmptyState';

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

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [filtros, setFiltros] = useState(initialFilters);
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
      message.error('Erro ao alterar status de pagamento');
    }
  }, [loadData]);

  const handleEdit = useCallback((transacao) => {
    setEditando(transacao);
    setForm({
      data: transacao.data,
      descricao: transacao.descricao || '',
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      tipo_pagamento: transacao.tipo_pagamento || 'debito',
      categoria_id: transacao.categoria_id || '',
      conta_id: transacao.conta_id || '',
      pago: transacao.pago || false
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    Modal.confirm({
      title: 'Excluir transação',
      content: 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.deleteTransacao(id);
          loadData();
          message.success('Transação excluída com sucesso');
        } catch (err) {
          console.error('Erro ao excluir transação:', err);
          message.error('Erro ao excluir transação');
        }
      }
    });
  }, [loadData]);

  const resetForm = () => {
    setForm(initialForm());
    setEditando(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditando(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateTransacao(form);
    if (Object.keys(errors).length > 0) {
      message.warning(Object.values(errors)[0]);
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
        message.success('Transação atualizada com sucesso');
      } else {
        await api.addTransacao(dados);
        message.success('Transação criada com sucesso');
      }

      setShowModal(false);
      setEditando(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      message.error('Erro ao salvar transação');
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
          pago: parseFloat(row.valor || row.Valor || row.value) > 0
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
        if (erros > 0) {
          message.warning(`${importadas} transações importadas (${erros} com erro)`);
        } else {
          message.success(`${importadas} transações importadas com sucesso!`);
        }
      }
    });
    e.target.value = '';
  };

  const clearFilters = () => {
    setFiltros(initialFilters());
    setQuickSearch('');
  };

  const filteredTransacoes = transacoes.filter(t => {
    if (!quickSearch) return true;
    const q = quickSearch.toLowerCase();
    return (
      (t.descricao || '').toLowerCase().includes(q) ||
      (t.categoria_nome || '').toLowerCase().includes(q) ||
      (t.conta_nome || '').toLowerCase().includes(q)
    );
  });

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
          <p className="page-subtitle">Controle entradas, saídas e pendências.</p>
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
              Carregando...
            </div>
          ) : filteredTransacoes.length === 0 ? (
            <EmptyState
              icon="💳"
              title="Nenhuma transação encontrada"
              description="Registre sua primeira receita ou despesa para começar."
              onAction={openCreateModal}
              actionLabel="Nova Transação"
            />
          ) : (
            filteredTransacoes.map((transacao) => (
              <TransactionCard
                key={transacao.id}
                transaction={transacao}
                onTogglePago={handleTogglePago}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onCancel={() => { setShowModal(false); resetForm(); }}
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
            <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Transacoes;

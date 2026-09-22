import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import FinanceGrid from '../components/FinanceGrid';
import { formatCurrency } from '../utils/currency';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';


const initialForm = () => ({
  nome: '',
  valor: '',
  dia_vencimento: '1',
  tipo: 'despesa',
  tipo_pagamento: 'pix',
  categoria_id: '',
  conta_id: '',
  cartao_id: '',
  total_parcelas: ''
});

function GastosFixos() {
  const [gastosFixos, setGastosFixos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
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
      const [gf, c, ct, cr] = await Promise.all([
        api.getGastosFixos(),
        api.getCategorias(),
        api.getContas(),
        api.getCartoes()
      ]);
      setGastosFixos(gf);
      setCategorias(c);
      setContas(ct);
      setCartoes(cr);
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
      cartao_id: gasto.cartao_id ? gasto.cartao_id.toString() : '',
      total_parcelas: gasto.total_parcelas?.toString() || ''
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    Modal.confirm({
      title: 'Excluir item fixo',
      content: 'Tem certeza? As transações já criadas permanecerão.',
      okText: 'Excluir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.deleteGastoFixo(id);
          loadData();
          message.success('Item excluído com sucesso');
        } catch (err) {
          console.error('Erro ao excluir gasto fixo:', err);
          message.error('Erro ao excluir item fixo');
        }
      }
    });
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
        headerName: 'Conta / Cartão',
        width: 160,
        valueGetter: (params) => (params.data?.cartao_nome ? `💳 ${params.data.cartao_nome}` : (params.data?.conta_nome || '')),
        cellRenderer: (params) => {
          if (params.data?.cartao_nome) {
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: params.data.cartao_cor || '#6366f1',
                    display: 'inline-block'
                  }}
                />
                💳 {params.data.cartao_nome}
              </span>
            );
          }
          return params.value || <span className="muted-cell">-</span>;
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

    if (form.tipo === 'despesa' && form.tipo_pagamento === 'credito' && !form.cartao_id) {
      message.warning('Selecione um cartão de crédito');
      return;
    }

    let diaVencimento = parseInt(form.dia_vencimento, 10);
    if (form.tipo === 'despesa' && form.tipo_pagamento === 'credito') {
      const card = cartoes.find((c) => c.id.toString() === form.cartao_id?.toString());
      if (card) {
        diaVencimento = card.dia_vencimento;
      }
    }

    const dados = {
      ...form,
      valor: parseFloat(form.valor),
      dia_vencimento: diaVencimento,
      tipo: form.tipo || 'despesa',
      total_parcelas: form.total_parcelas ? parseInt(form.total_parcelas, 10) : null,
      conta_id: form.tipo_pagamento === 'credito' ? null : (form.conta_id || null),
      cartao_id: form.tipo_pagamento === 'credito' && form.cartao_id ? parseInt(form.cartao_id, 10) : null,
      categoria_id: form.categoria_id || null
    };

    try {
      if (editando) {
        await api.updateGastoFixo(editando.id, dados);
        message.success('Item fixo atualizado com sucesso');
      } else {
        const result = await api.addGastoFixo(dados);
        const label = dados.tipo === 'receita' ? 'Receita fixa' : 'Gasto fixo';
        message.success(`${label} criado(a)! ${result.transacoesCriadas} transações geradas.`);
      }

      setShowModal(false);
      setEditando(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar gasto fixo:', err);
      message.error('Erro ao salvar item fixo');
    }
  };

  const totalDespesas = gastosFixos.filter((g) => g.tipo === 'despesa').reduce((sum, g) => sum + parseFloat(g.valor), 0);
  const totalReceitas = gastosFixos.filter((g) => g.tipo === 'receita').reduce((sum, g) => sum + parseFloat(g.valor), 0);
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

  const isCredito = form.tipo === 'despesa' && form.tipo_pagamento === 'credito';
  const selectedCartao = cartoes.find((c) => c.id.toString() === form.cartao_id?.toString());

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
          <div className="stat-header">
            <span className="stat-label">Total Despesas</span>
            <span className="stat-indicator negative">↓</span>
          </div>
          <div className="stat-value negative">{formatCurrency(totalDespesas)}</div>
        </div>
        <div className="stat-card receita">
          <div className="stat-header">
            <span className="stat-label">Total Receitas</span>
            <span className="stat-indicator positive">↑</span>
          </div>
          <div className="stat-value positive">{formatCurrency(totalReceitas)}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-header">
            <span className="stat-label">Saldo Fixo</span>
            <span className="stat-indicator saldo">⚡</span>
          </div>
          <div className={`stat-value ${saldoFixo >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(saldoFixo)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Quantidade</span>
            <span className="stat-indicator neutral">📋</span>
          </div>
          <div className="stat-value">{gastosFiltrados.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Próximo vencimento</span>
            <span className="stat-indicator neutral">📅</span>
          </div>
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

      <Modal
        open={showModal}
        onCancel={() => { setShowModal(false); setEditando(null); resetForm(); }}
        title={
          editando
            ? (editando.tipo === 'receita' ? 'Editar Receita Fixa' : 'Editar Gasto Fixo')
            : (form.tipo === 'receita' ? 'Nova Receita Fixa' : 'Novo Gasto Fixo')
        }
        footer={null}
        width={640}
        destroyOnHide
      >
        <form onSubmit={handleSubmit} style={{ paddingTop: 8 }}>
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
              <label className="form-label">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => {
                  const newTipo = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    tipo: newTipo,
                    tipo_pagamento: newTipo === 'receita' && prev.tipo_pagamento === 'credito' ? 'pix' : prev.tipo_pagamento
                  }));
                }}
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
                onChange={(e) => {
                  const newTipoPagamento = e.target.value;
                  let newCartaoId = form.cartao_id;
                  let newDiaVencimento = form.dia_vencimento;
                  if (newTipoPagamento === 'credito' && !newCartaoId && cartoes.length > 0) {
                    newCartaoId = cartoes[0].id.toString();
                    newDiaVencimento = cartoes[0].dia_vencimento.toString();
                  }
                  setForm((prev) => ({
                    ...prev,
                    tipo_pagamento: newTipoPagamento,
                    cartao_id: newCartaoId,
                    dia_vencimento: newDiaVencimento
                  }));
                }}
                className="form-select"
              >
                <option value="pix">Pix</option>
                <option value="debito">Débito</option>
                {form.tipo === 'despesa' && <option value="credito">Crédito</option>}
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

          {isCredito ? (
            <div className="form-group">
              <label className="form-label">Cartão de Crédito</label>
              <select
                value={form.cartao_id}
                onChange={(e) => {
                  const cardId = e.target.value;
                  const card = cartoes.find((c) => c.id.toString() === cardId);
                  setForm((prev) => ({
                    ...prev,
                    cartao_id: cardId,
                    dia_vencimento: card ? card.dia_vencimento.toString() : prev.dia_vencimento
                  }));
                }}
                className="form-select"
                required
              >
                <option value="">Selecione o cartão...</option>
                {cartoes.map((cartao) => (
                  <option key={cartao.id} value={cartao.id}>
                    {cartao.nome} (Fecha: dia {cartao.dia_fechamento} / Vence: dia {cartao.dia_vencimento})
                  </option>
                ))}
              </select>
              {cartoes.length === 0 ? (
                <span className="form-hint" style={{ color: '#ef4444' }}>
                  Nenhum cartão cadastrado. Cadastre um cartão na tela de Cartões primeiro.
                </span>
              ) : (
                selectedCartao && (
                  <span className="form-hint" style={{ color: '#10b981', display: 'block', marginTop: 4 }}>
                    ✓ Vencimento automático: todo dia {selectedCartao.dia_vencimento} (conforme fatura do cartão)
                  </span>
                )
              )}
            </div>
          ) : (
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
          )}

          <div className={isCredito ? 'form-grid two-columns' : 'form-grid three-columns'}>
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
            {!isCredito && (
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
            )}
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
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditando(null); resetForm(); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default GastosFixos;

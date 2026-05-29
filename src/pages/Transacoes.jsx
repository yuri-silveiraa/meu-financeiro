import { useCallback, useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FilePdfOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import FinanceGrid from '../components/FinanceGrid';
import { formatCurrency } from '../utils/currency';
import { validateTransacao } from '../utils/validation';

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
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
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
        window.api.getTransacoes(filtros),
        window.api.getCategorias(),
        window.api.getContas()
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
    await window.api.togglePago(id);
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
      await window.api.deleteTransacao(id);
      loadData();
    }
  }, [loadData]);

  const columnDefs = useMemo(() => [
    {
      headerName: '',
      field: 'select',
      width: 48,
      minWidth: 48,
      pinned: 'left',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true
    },
    {
      headerName: 'Pago',
      field: 'pago',
      width: 92,
      minWidth: 92,
      pinned: 'left',
      filter: true,
      cellRenderer: (params) => (
        <button
          type="button"
          aria-label={params.value ? 'Marcar como não paga' : 'Marcar como paga'}
          className={`status-toggle ${params.value ? 'is-paid' : 'is-open'}`}
          onClick={() => handleTogglePago(params.data.id)}
        >
          {params.value ? <CheckOutlined /> : <CloseOutlined />}
          <span>{params.value ? 'Pago' : 'Aberto'}</span>
        </button>
      )
    },
    {
      headerName: 'Data',
      field: 'data',
      width: 116,
      sort: 'desc',
      valueFormatter: (params) => formatDate(params.value)
    },
    {
      headerName: 'Descrição',
      field: 'descricao',
      flex: 1.6,
      minWidth: 220,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: 'Categoria',
      field: 'categoria_nome',
      flex: 1,
      minWidth: 150,
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
      headerName: 'Conta',
      field: 'conta_nome',
      flex: 0.9,
      minWidth: 140,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: 'Tipo',
      field: 'tipo',
      width: 112,
      cellRenderer: (params) => (
        <span className={`money-type ${params.value}`}>
          {params.value === 'receita' ? 'Receita' : 'Despesa'}
        </span>
      )
    },
    {
      headerName: 'Pagamento',
      field: 'tipo_pagamento',
      width: 128,
      cellRenderer: (params) => {
        if (!params.value) return <span className="muted-cell">-</span>;
        return <span className={`tipo-badge ${params.value}`}>{params.value}</span>;
      }
    },
    {
      headerName: 'Valor',
      field: 'valor',
      width: 132,
      type: 'rightAligned',
      cellClass: (params) => params.data.tipo === 'receita' ? 'money-cell income' : 'money-cell expense',
      valueFormatter: (params) => {
        const prefix = params.data.tipo === 'receita' ? '+ ' : '- ';
        return prefix + formatCurrency(params.value);
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
  ], [handleDelete, handleEdit, handleTogglePago]);

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
      pago: form.tipo === 'receita' ? 1 : (form.pago ? 1 : 0)
    };

    if (editando) {
      await window.api.updateTransacao({ ...dados, id: editando.id });
    } else {
      await window.api.addTransacao(dados);
    }

    setShowModal(false);
    setEditando(null);
    resetForm();
    loadData();
  };

  const handleImportCSV = async () => {
    const result = await window.api.openFile('csv');
    if (result.canceled || !result.filePaths.length) return;

    const response = await fetch(`file://${result.filePaths[0]}`);
    const text = await response.text();

    Papa.parse(text, {
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
          pago: parseFloat(row.valor || row.Valor || row.value) > 0 ? 1 : 0
        })).map(transacao => {
          const categoria = categorias.find(c => transacao.descricao_lower.includes(c.nome.toLowerCase()));
          return { ...transacao, categoria_id: categoria?.id || null };
        });

        for (const transacao of transacoesImportadas) {
          await window.api.addTransacao(transacao);
        }

        loadData();
        alert(`Importadas ${transacoesImportadas.length} transações`);
      }
    });
  };

  const handleImportPDF = async () => {
    const result = await window.api.openFile('pdf');
    if (result.canceled || !result.filePaths.length) return;

    const pdfResult = await window.api.readPDF(result.filePaths[0]);

    if (!pdfResult.success) {
      alert('Erro ao ler PDF: ' + pdfResult.error);
      return;
    }

    const linhas = pdfResult.text.split('\n').filter(linha => linha.trim());
    const transacoesExtraidas = [];
    const regexData = /(\d{2})[/-](\d{2})[/-](\d{4})/;
    const regexValor = /[\d.,]+(?=\s|$)/;

    for (const linha of linhas) {
      const matchData = linha.match(regexData);
      const matchValor = linha.match(regexValor);

      if (matchData && matchValor) {
        const [, dia, mes, ano] = matchData;
        const valorStr = matchValor[0].replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorStr);

        if (!Number.isNaN(valor) && valor > 0) {
          transacoesExtraidas.push({
            data: `${ano}-${mes}-${dia}`,
            descricao: linha.substring(0, 50),
            valor,
            tipo: 'despesa',
            tipo_pagamento: 'debito',
            pago: 0
          });
        }
      }
    }

    if (transacoesExtraidas.length === 0) {
      alert('Nenhuma transação encontrada no PDF. Tente usar o formato CSV.');
      return;
    }

    for (const transacao of transacoesExtraidas) {
      await window.api.addTransacao(transacao);
    }

    loadData();
    alert(`Importadas ${transacoesExtraidas.length} transações do PDF`);
  };

  const clearFilters = () => {
    setFiltros(initialFilters());
    setQuickSearch('');
  };

  const updateSelectedPaidStatus = async (selectedRows, pago, clearSelection) => {
    await Promise.all(selectedRows.map((transacao) => (
      window.api.updateTransacao({ ...transacao, pago: pago ? 1 : 0 })
    )));
    clearSelection();
    loadData();
  };

  const deleteSelectedRows = async (selectedRows, clearSelection) => {
    const plural = selectedRows.length > 1 ? 'transações selecionadas' : 'transação selecionada';
    if (!confirm(`Tem certeza que deseja excluir ${selectedRows.length} ${plural}?`)) return;

    await Promise.all(selectedRows.map((transacao) => window.api.deleteTransacao(transacao.id)));
    clearSelection();
    loadData();
  };

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita' && t.pago).reduce((sum, t) => sum + t.valor, 0);
  const totalDespesasPagas = transacoes.filter(t => t.tipo === 'despesa' && t.pago).reduce((sum, t) => sum + t.valor, 0);
  const totalDespesasNaoPagas = transacoes.filter(t => t.tipo === 'despesa' && !t.pago).reduce((sum, t) => sum + t.valor, 0);
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
          <button className="btn-secondary" onClick={handleImportCSV} disabled={loading}>
            <UploadOutlined /> CSV
          </button>
          <button className="btn-secondary" onClick={handleImportPDF} disabled={loading}>
            <FilePdfOutlined /> PDF
          </button>
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

        <FinanceGrid
          storageKey="finance-grid:transacoes"
          rowData={transacoes}
          columnDefs={columnDefs}
          loading={loading}
          quickFilterText={quickSearch}
          height={520}
          rowSelection="multiple"
          getRowId={(params) => String(params.data.id)}
          selectionActions={(selectedRows, clearSelection) => (
            <>
              <button type="button" className="btn-ghost" onClick={() => updateSelectedPaidStatus(selectedRows, true, clearSelection)}>
                Marcar pagas
              </button>
              <button type="button" className="btn-ghost" onClick={() => updateSelectedPaidStatus(selectedRows, false, clearSelection)}>
                Marcar abertas
              </button>
              <button type="button" className="btn-ghost danger" onClick={() => deleteSelectedRows(selectedRows, clearSelection)}>
                Excluir
              </button>
            </>
          )}
        />
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

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FilePdfOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { validateTransacao } from '../utils/validation';

function Transacoes() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', tipo: '', pago: '' });
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    tipo: 'despesa',
    tipo_pagamento: 'debito',
    categoria_id: '',
    conta_id: '',
    pago: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [gridApi, setGridApi] = useState(null);

  useEffect(() => {
    loadData();
  }, [filtros]);

  const loadData = async () => {
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
  };

  const handleTogglePago = useCallback(async (id) => {
    await window.api.togglePago(id);
    loadData();
  }, []);

  const columnDefs = [
    {
      headerName: 'Pago',
      field: 'pago',
      width: 80,
      cellRenderer: (params) => (
        <button
          onClick={() => handleTogglePago(params.data.id)}
          style={{
            background: params.value ? '#22c55e' : '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {params.value ? <CheckOutlined /> : <CloseOutlined />}
        </button>
      )
    },
    {
      headerName: 'Data',
      field: 'data',
      width: 110,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('pt-BR'),
      sortable: true
    },
    {
      headerName: 'Descrição',
      field: 'descricao',
      flex: 2,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: 'Categoria',
      field: 'categoria_nome',
      flex: 1,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return (
          <span style={{
            backgroundColor: params.data.categoria_cor,
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 11
          }}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Tipo',
      field: 'tipo_pagamento',
      width: 100,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return (
          <span className={`tipo-badge ${params.value}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: 'Valor',
      field: 'valor',
      width: 120,
      cellStyle: (params) => ({
        color: params.data.tipo === 'receita' ? '#22c55e' : '#ef4444',
        fontWeight: 600
      }),
      valueFormatter: (params) => {
        const prefix = params.data.tipo === 'receita' ? '+ ' : '- ';
        return prefix + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
      },
      sortable: true
    },
    {
      headerName: 'Ações',
      width: 100,
      cellRenderer: (params) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn-secondary"
            onClick={() => handleEdit(params.data)}
            style={{ padding: '4px 8px' }}
          >
            <EditOutlined />
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleDelete(params.data.id)}
            style={{ padding: '4px 8px', color: '#ef4444' }}
          >
            <DeleteOutlined />
          </button>
        </div>
      )
    }
  ];

  const defaultColDef = {
    sortable: true,
    resizable: true
  };

   const handleSubmit = async (e) => {
     e.preventDefault();
     
     // Validate form
     const errors = validateTransacao(form);
     if (Object.keys(errors).length > 0) {
       // Show first error or handle as needed
       alert(Object.values(errors)[0]);
       return;
     }
     
     const dados = { 
       ...form, 
       valor: parseFloat(form.valor), 
       pago: form.pago ? 1 : 0 
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

  const handleEdit = (t) => {
    setEditando(t);
    setForm({
      data: t.data,
      descricao: t.descricao || '',
      valor: t.valor.toString(),
      tipo: t.tipo,
      tipo_pagamento: t.tipo_pagamento || '',
      categoria_id: t.categoria_id || '',
      conta_id: t.conta_id || '',
      pago: t.pago === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      await window.api.deleteTransacao(id);
      loadData();
    }
  };

  const resetForm = () => {
    setForm({
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      valor: '',
      tipo: 'despesa',
      tipo_pagamento: 'debito',
      categoria_id: '',
      conta_id: '',
      pago: false
    });
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
          pago: 0
        })).map(t => {
          const cat = categorias.find(c => t.descricao_lower.includes(c.nome.toLowerCase()));
          return { ...t, categoria_id: cat?.id || null };
        });

        for (const t of transacoesImportadas) {
          await window.api.addTransacao(t);
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

    const text = pdfResult.text;
    const linhas = text.split('\n').filter(l => l.trim());

    const transacoesExtraidas = [];
    const regexData = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/;
    const regexValor = /[\d\.,]+(?=\s|$)/;

    for (const linha of linhas) {
      const matchData = linha.match(regexData);
      const matchValor = linha.match(regexValor);

      if (matchData && matchValor) {
        const dia = matchData[1];
        const mes = matchData[2];
        const ano = matchData[3];
        const valorStr = matchValor[0].replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorStr);

        if (!isNaN(valor) && valor > 0) {
          transacoesExtraidas.push({
            data: `${ano}-${mes}-${dia}`,
            descricao: linha.substring(0, 50),
            valor: valor,
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

    for (const t of transacoesExtraidas) {
      await window.api.addTransacao(t);
    }
    loadData();
    alert(`Importadas ${transacoesExtraidas.length} transações do PDF`);
  };

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita' && t.pago).reduce((sum, t) => sum + t.valor, 0);
  const totalDespesasPagas = transacoes.filter(t => t.tipo === 'despesa' && t.pago).reduce((sum, t) => sum + t.valor, 0);
  const totalDespesasNaoPagas = transacoes.filter(t => t.tipo === 'despesa' && !t.pago).reduce((sum, t) => sum + t.valor, 0);
  const saldoAtual = totalReceitas - totalDespesasPagas;
  const saldoProjetado = totalReceitas - totalDespesasPagas - totalDespesasNaoPagas;

   return (
     <div>
       {error && (
         <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
           {error}
         </div>
       )}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
         <h1 className="page-title" style={{ margin: 0 }}>Transações</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={handleImportCSV} disabled={loading}>
              {loading ? 'Carregando...' : (
                <>
                  <UploadOutlined /> CSV
                </>
              )}
            </button>
            <button className="btn-secondary" onClick={handleImportPDF} disabled={loading}>
              {loading ? 'Carregando...' : (
                <>
                  <FilePdfOutlined /> PDF
                </>
              )}
            </button>
            <button className="btn-primary" onClick={() => { resetForm(); setEditando(null); setShowModal(true); }} disabled={loading}>
              {loading ? 'Carregando...' : (
                <>
                  <PlusOutlined /> Nova
                </>
              )}
            </button>
         </div>
       </div>

       <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
         <div className="stat-card receita">
           <div className="stat-label">Receitas Pagas</div>
           <div className="stat-value" style={{ color: '#22c55e' }}>
             {formatCurrency(totalReceitas)}
           </div>
         </div>
         <div className="stat-card despesa">
           <div className="stat-label">Despesas Pagas</div>
           <div className="stat-value" style={{ color: '#ef4444' }}>
             {formatCurrency(totalDespesasPagas)}
           </div>
         </div>
         <div className="stat-card">
           <div className="stat-label">Saldo Atual</div>
           <div className="stat-value" style={{ color: saldoAtual >= 0 ? '#22c55e' : '#ef4444' }}>
             {formatCurrency(saldoAtual)}
           </div>
         </div>
         <div className="stat-card saldo">
           <div className="stat-label">Saldo Projetado</div>
           <div className="stat-value" style={{ color: saldoProjetado >= 0 ? '#22c55e' : '#ef4444' }}>
             {formatCurrency(saldoProjetado)}
           </div>
           <div style={{ fontSize: 10, color: '#6b7280' }}>(inclui não pagas)</div>
         </div>
       </div>

      <div className="filters-bar">
        <input
          type="date"
          value={filtros.dataInicio}
          onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
          className="form-input"
          style={{ width: 150 }}
        />
        <input
          type="date"
          value={filtros.dataFim}
          onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
          className="form-input"
          style={{ width: 150 }}
        />
        <select
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
          className="form-select"
          style={{ width: 150 }}
        >
          <option value="">Todos os tipos</option>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
        <select
          value={filtros.pago}
          onChange={(e) => setFiltros({ ...filtros, pago: e.target.value })}
          className="form-select"
          style={{ width: 150 }}
        >
          <option value="">Todos</option>
          <option value="1">Pagas</option>
          <option value="0">Não Pagas</option>
        </select>
      </div>

      <div className="ag-theme-alpine" style={{ height: 450, width: '100%' }}>
        <AgGridReact
          rowData={transacoes}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={false}
          animateRows={true}
          onGridReady={(params) => setGridApi(params.api)}
        />
      </div>

      {transacoes.length === 0 && (
        <div className="empty-state">Nenhuma transação encontrada</div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editando ? 'Editar Transação' : 'Nova Transação'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
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
                <label className="form-label">Descrição</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="form-input"
                />
              </div>
              {form.tipo === 'despesa' && (
                <>
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
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.pago}
                        onChange={(e) => setForm({ ...form, pago: e.target.checked })}
                      />
                      Marcar como pago
                    </label>
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Selecione...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Conta</label>
                <select
                  value={form.conta_id}
                  onChange={(e) => setForm({ ...form, conta_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Selecione...</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
import { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

function GastosFixos() {
  const [gastosFixos, setGastosFixos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    dia_vencimento: '1',
    tipo_pagamento: 'pix',
    categoria_id: ''
  });

  const [columnDefs] = useState([
    { field: 'nome', headerName: 'Nome', flex: 2 },
    {
      field: 'valor',
      headerName: 'Valor',
      flex: 1,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
      }
    },
    { field: 'dia_vencimento', headerName: 'Dia', flex: 0.5 },
    { field: 'tipo_pagamento', headerName: 'Pagamento', flex: 1 },
    {
      field: 'categoria_nome',
      headerName: 'Categoria',
      flex: 1,
      valueFormatter: (params) => params.value || '-'
    },
    {
      headerName: 'Ações',
      flex: 1,
      cellRenderer: (params) => (
        <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
          <button
            className="btn-secondary"
            onClick={() => handleEdit(params.data)}
            style={{ padding: '4px 8px', fontSize: 12 }}
          >
            <EditOutlined />
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleDelete(params.data.id)}
            style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
          >
            <DeleteOutlined />
          </button>
        </div>
      )
    }
  ]);

  const defaultColDef = {
    sortable: true,
    resizable: true
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [gf, c] = await Promise.all([
      window.api.getGastosFixos(),
      window.api.getCategorias()
    ]);
    setGastosFixos(gf);
    setCategorias(c);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dados = {
      ...form,
      valor: parseFloat(form.valor),
      dia_vencimento: parseInt(form.dia_vencimento)
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

  const handleEdit = (g) => {
    setEditando(g);
    setForm({
      nome: g.nome,
      valor: g.valor.toString(),
      dia_vencimento: g.dia_vencimento.toString(),
      tipo_pagamento: g.tipo_pagamento || 'pix',
      categoria_id: g.categoria_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir? As transações já criadas permanecerão.')) {
      await window.api.deleteGastoFixo(id);
      loadData();
    }
  };

  const resetForm = () => {
    setForm({
      nome: '',
      valor: '',
      dia_vencimento: '1',
      tipo_pagamento: 'pix',
      categoria_id: ''
    });
  };

  const totalMensal = gastosFixos.reduce((sum, g) => sum + g.valor, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Gastos Fixos</h1>
          <span style={{ color: '#6b7280' }}>Despesas recorrentes mensais</span>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setEditando(null); setShowModal(true); }}>
          <PlusOutlined /> Novo Gasto Fixo
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total de Gastos Fixos</div>
          <div className="stat-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMensal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Quantidade</div>
          <div className="stat-value">{gastosFixos.length}</div>
        </div>
      </div>

      <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact
          rowData={gastosFixos}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={false}
          animateRows={true}
        />
      </div>

      {gastosFixos.length === 0 && (
        <div className="empty-state">
          Nenhum gasto fixo cadastrado. Clique em "Novo Gasto Fixo" para começar.
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                  {categorias.map((c) => (
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

export default GastosFixos;
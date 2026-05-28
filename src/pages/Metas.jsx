import { useState, useEffect } from 'react';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { validateRequired } from '../utils/validation';

function Metas() {
  const [metas, setMetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    valor_meta: '',
    valor_atual: '',
    prazo: '',
    categoria_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, c] = await Promise.all([
        window.api.getMetas(),
        window.api.getCategorias()
      ]);
      setMetas(m);
      setCategorias(c);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dados = {
      ...form,
      valor_meta: parseFloat(form.valor_meta),
      valor_atual: parseFloat(form.valor_atual || 0)
    };

    if (editando) {
      await window.api.updateMeta({ ...dados, id: editando.id });
    } else {
      await window.api.addMeta(dados);
    }

    setShowModal(false);
    setEditando(null);
    resetForm();
    loadData();
  };

  const handleEdit = (m) => {
    setEditando(m);
    setForm({
      nome: m.nome,
      valor_meta: m.valor_meta.toString(),
      valor_atual: m.valor_atual.toString(),
      prazo: m.prazo || '',
      categoria_id: m.categoria_id || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      nome: '',
      valor_meta: '',
      valor_atual: '',
      prazo: '',
      categoria_id: ''
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calcularProgresso = (meta) => {
    if (meta.valor_meta === 0) return 0;
    return Math.min(100, (meta.valor_atual / meta.valor_meta) * 100);
  };

   return (
     <div>
       {error && (
         <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
           {error}
         </div>
       )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 className="page-title" style={{ margin: 0 }}>Metas de Economia</h1>
          <button className="btn-primary" onClick={() => { resetForm(); setEditando(null); setShowModal(true); }} disabled={loading}>
            {loading ? 'Carregando...' : (
              <>
                <PlusOutlined /> Nova Meta
              </>
            )}
          </button>
        </div>

      {metas.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {metas.map((meta) => {
            const progresso = calcularProgresso(meta);
            return (
              <div key={meta.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{meta.nome}</h3>
                    {meta.categoria_nome && (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{meta.categoria_nome}</span>
                    )}
                  </div>
                  <button className="btn-secondary" onClick={() => handleEdit(meta)} style={{ padding: '6px 10px' }}>
                    <EditOutlined />
                  </button>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#6b7280' }}>Progresso</span>
                    <span style={{ fontWeight: 500 }}>{progresso.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progresso}%`, background: progresso >= 100 ? '#22c55e' : '#3b82f6' }}></div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>Atual: <strong>{formatCurrency(meta.valor_atual)}</strong></span>
                  <span>Meta: <strong>{formatCurrency(meta.valor_meta)}</strong></span>
                </div>
                {meta.prazo && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                    Prazo: {new Date(meta.prazo).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          Nenhuma meta criada. Clique em "Nova Meta" para começar.
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editando ? 'Editar Meta' : 'Nova Meta'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome da Meta</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Valor da Meta</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_meta}
                  onChange={(e) => setForm({ ...form, valor_meta: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Valor Atual</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_atual}
                  onChange={(e) => setForm({ ...form, valor_atual: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prazo</label>
                <input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Categoria (opcional)</label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Todas as categorias</option>
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

export default Metas;
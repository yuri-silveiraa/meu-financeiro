import { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { validateRequired } from '../utils/validation';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';

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
        api.getMetas(),
        api.getCategorias()
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

    const nomeError = validateRequired(form.nome, 'Nome');
    if (nomeError) {
      message.warning(nomeError);
      return;
    }

    const dados = {
      ...form,
      valor_meta: parseFloat(form.valor_meta),
      valor_atual: parseFloat(form.valor_atual || 0),
      categoria_id: form.categoria_id || null
    };

    try {
      if (editando) {
        await api.updateMeta(editando.id, dados);
        message.success('Meta atualizada com sucesso');
      } else {
        await api.addMeta(dados);
        message.success('Meta criada com sucesso');
      }

      setShowModal(false);
      setEditando(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
      message.error('Erro ao salvar meta');
    }
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

  const calcularProgresso = (meta) => {
    if (meta.valor_meta === 0) return 0;
    return Math.min(100, (parseFloat(meta.valor_atual) / parseFloat(meta.valor_meta)) * 100);
  };

  const getProgressColor = (progresso, prazo) => {
    if (progresso >= 100) return '#22c55e';
    if (prazo) {
      const hoje = new Date();
      const dataPrazo = new Date(prazo);
      if (dataPrazo < hoje) return '#ef4444'; // prazo vencido
    }
    if (progresso >= 80) return '#3b82f6';
    if (progresso >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const isPrazoVencido = (prazo) => {
    if (!prazo) return false;
    return new Date(prazo) < new Date();
  };

  return (
    <div>
      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Metas de Economia</h1>
        <button
          className="btn-primary"
          onClick={() => { resetForm(); setEditando(null); setShowModal(true); }}
          disabled={loading}
        >
          <PlusOutlined /> Nova Meta
        </button>
      </div>

      {metas.length > 0 ? (
        <div className="metas-grid">
          {metas.map((meta) => {
            const progresso = calcularProgresso(meta);
            const vencido = isPrazoVencido(meta.prazo);
            const isCompleted = progresso >= 100;

            const gradientBar = isCompleted
              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
              : vencido
              ? 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
              : progresso >= 80
              ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
              : progresso >= 30
              ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
              : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';

            return (
              <div key={meta.id} className={`card meta-card ${isCompleted ? 'is-completed' : ''}`}>
                <div className="meta-card-header">
                  <div className="meta-card-title-group">
                    <h3 className="meta-title">{meta.nome}</h3>
                    {meta.categoria_nome && (
                      <span className="meta-cat-pill">
                        <span className="tx-dot-mini" style={{ background: '#3b82f6' }} />
                        {meta.categoria_nome}
                      </span>
                    )}
                  </div>
                  <div className="meta-header-actions">
                    <span className={`meta-status-pill ${isCompleted ? 'completed' : vencido ? 'expired' : 'active'}`}>
                      {isCompleted ? '✓ Concluído' : `${progresso.toFixed(1)}%`}
                    </span>
                    <button
                      className="icon-button"
                      onClick={() => handleEdit(meta)}
                      title="Editar meta"
                      type="button"
                    >
                      <EditOutlined />
                    </button>
                  </div>
                </div>

                <div className="meta-progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(progresso, 100)}%`,
                        background: gradientBar,
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                </div>

                <div className="meta-values-row">
                  <div className="meta-val-item">
                    <span className="meta-val-label">Guardado</span>
                    <span className="meta-val-amount current">{formatCurrency(meta.valor_atual)}</span>
                  </div>
                  <div className="meta-val-item right">
                    <span className="meta-val-label">Alvo</span>
                    <span className="meta-val-amount target">{formatCurrency(meta.valor_meta)}</span>
                  </div>
                </div>

                {meta.prazo && (
                  <div className="meta-footer">
                    <span className={`meta-deadline-pill ${vencido ? 'expired' : ''}`}>
                      {vencido ? '⚠️ Vencido:' : '📅 Prazo:'} {new Date(meta.prazo).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="🎯"
          title="Sem metas ainda"
          description="Defina objetivos financeiros para acompanhar seu progresso de economia."
          onAction={() => { resetForm(); setEditando(null); setShowModal(true); }}
          actionLabel="Nova Meta"
        />
      )}

      <Modal
        open={showModal}
        onCancel={() => { setShowModal(false); setEditando(null); resetForm(); }}
        title={editando ? 'Editar Meta' : 'Nova Meta'}
        footer={null}
        width={480}
        destroyOnHide
      >
        <form onSubmit={handleSubmit} style={{ paddingTop: 8 }}>
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
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditando(null); resetForm(); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Metas;

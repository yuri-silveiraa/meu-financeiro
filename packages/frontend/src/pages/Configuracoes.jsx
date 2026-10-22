import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import { formatCurrency } from '../utils/currency';
import { validateRequired } from '../utils/validation';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '../components/Skeleton';

const CORES = [
  // Verdes e Esmeraldas
  '#22c55e', '#10b981', '#14b8a6', '#059669',
  // Azuis e Cianos
  '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb',
  // Índigos e Roxos
  '#6366f1', '#8b5cf6', '#a855f7', '#7c3aed',
  // Rosas e Vermelhos
  '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  // Laranjas e Amarelos
  '#f97316', '#f59e0b', '#eab308', '#84cc16',
  // Terrosos e Neutros
  '#78716c', '#64748b', '#475569', '#1e293b'
];

function Configuracoes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [showModalConta, setShowModalConta] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [editandoConta, setEditandoConta] = useState(null);
  const [formCategoria, setFormCategoria] = useState({ nome: '', cor: '#3b82f6' });
  const [formConta, setFormConta] = useState({ nome: '', banco: '', tipo_conta: 'corrente', saldo_inicial: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, ct] = await Promise.all([
        api.getCategorias(),
        api.getContas()
      ]);
      setCategorias(c);
      setContas(ct);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

   const openNovaCategoria = () => {
     setEditandoCategoria(null);
     setFormCategoria({ nome: '', cor: '#3b82f6' });
     setShowModalCategoria(true);
   };

   const openEditarCategoria = (categoria) => {
     setEditandoCategoria(categoria);
     setFormCategoria({ nome: categoria.nome, cor: categoria.cor || '#3b82f6' });
     setShowModalCategoria(true);
   };

   const closeCategoriaModal = () => {
     setShowModalCategoria(false);
     setEditandoCategoria(null);
     setFormCategoria({ nome: '', cor: '#3b82f6' });
   };

   const handleSubmitCategoria = async (e) => {
     e.preventDefault();
     
     const nomeError = validateRequired(formCategoria.nome, 'Nome');
     if (nomeError) {
       message.warning(nomeError);
       return;
     }

     
     try {
       if (editandoCategoria) {
         await api.updateCategoria(editandoCategoria.id, { ...formCategoria, icone: editandoCategoria.icone || 'folder' });
       } else {
         await api.addCategoria(formCategoria);
       }

       closeCategoriaModal();
       loadData();
     } catch (err) {
       console.error('Erro ao salvar categoria:', err);
       setError('Erro ao salvar categoria');
     }
   };

   const handleDeleteCategoria = async (categoria) => {
     Modal.confirm({
       title: `Excluir categoria "${categoria.nome}"?`,
       content: 'Transações, metas e gastos fixos ligados a ela ficarão sem categoria.',
       okText: 'Excluir',
       okType: 'danger',
       cancelText: 'Cancelar',
       onOk: async () => {
         try {
           await api.deleteCategoria(categoria.id);
           loadData();
           message.success('Categoria excluída com sucesso');
         } catch (err) {
           console.error('Erro ao excluir categoria:', err);
           message.error('Erro ao excluir categoria');
         }
       }
     });
   };

   const openNovaConta = () => {
     setEditandoConta(null);
     setFormConta({ nome: '', banco: '', tipo_conta: 'corrente', saldo_inicial: '' });
     setShowModalConta(true);
   };

   const openEditarConta = (conta) => {
     setEditandoConta(conta);
     setFormConta({
       nome: conta.nome,
       banco: conta.banco || '',
       tipo_conta: conta.tipo_conta || 'corrente',
       saldo_inicial: conta.saldo_inicial?.toString() || ''
     });
     setShowModalConta(true);
   };

   const closeContaModal = () => {
     setShowModalConta(false);
     setEditandoConta(null);
     setFormConta({ nome: '', banco: '', tipo_conta: 'corrente', saldo_inicial: '' });
   };

   const handleSubmitConta = async (e) => {
     e.preventDefault();

     const nomeError = validateRequired(formConta.nome, 'Nome da Conta');
     if (nomeError) {
       message.warning(nomeError);
       return;
     }

     const bancoError = validateRequired(formConta.banco, 'Banco');
     if (bancoError) {
       message.warning(bancoError);
       return;
     }

     const conta = { ...formConta, saldo_inicial: parseFloat(formConta.saldo_inicial || 0) };
     try {
       if (editandoConta) {
         await api.updateConta(editandoConta.id, conta);
         message.success('Conta atualizada com sucesso');
       } else {
         await api.addConta(conta);
         message.success('Conta criada com sucesso');
       }

       closeContaModal();
       loadData();
     } catch (err) {
       console.error('Erro ao salvar conta:', err);
       message.error('Erro ao salvar conta');
     }
   };

   const handleDeleteConta = async (conta) => {
     Modal.confirm({
       title: `Excluir conta "${conta.nome}"?`,
       content: 'As transações ligadas a ela continuarão salvas, mas ficarão sem conta.',
       okText: 'Excluir',
       okType: 'danger',
       cancelText: 'Cancelar',
       onOk: async () => {
         try {
           await api.deleteConta(conta.id);
           loadData();
           message.success('Conta excluída com sucesso');
         } catch (err) {
           console.error('Erro ao excluir conta:', err);
           message.error('Erro ao excluir conta');
         }
       }
     });
   };


   const handleExportData = async () => {
     try {
       const data = await api.exportMyData();
       const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
       a.click();
       URL.revokeObjectURL(url);
       message.success('Dados exportados com sucesso!');
     } catch (err) {
       console.error('Erro ao exportar dados:', err);
       message.error('Erro ao exportar dados');
     }
   };

   const handleDeleteAccount = () => {
     Modal.confirm({
       title: '⚠️ Excluir conta permanentemente?',
       content: 'Esta ação é IRREVERSÍVEL. Todos os seus dados (transações, categorias, contas, cartões, metas e gastos fixos) serão excluídos permanentemente.',
       okText: 'Sim, excluir tudo',
       okType: 'danger',
       cancelText: 'Cancelar',
       onOk: async () => {
         try {
           await api.deleteMyAccount();
           message.success('Conta excluída com sucesso');
           logout();
           navigate('/login');
         } catch (err) {
           console.error('Erro ao excluir conta:', err);
           message.error('Erro ao excluir conta');
         }
       }
     });
   };

   return (
     <div>
       {error && (
         <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
           {error}
         </div>
       )}


        <div className="config-grid">
         <div className="card">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Categorias</h3>
              <button className="btn-secondary" onClick={openNovaCategoria} disabled={loading}>
                {loading ? 'Carregando...' : (
                  <>
                    <PlusOutlined /> Nova
                  </>
                )}
              </button>
           </div>
           {loading && categorias.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width="100%" height="40px" borderRadius="8px" />
              <Skeleton width="100%" height="40px" borderRadius="8px" />
              <Skeleton width="100%" height="40px" borderRadius="8px" />
            </div>
          ) : categorias.length > 0 ? (
            <div>
              {categorias.map((c) => (
                <div key={c.id} className="settings-row">
                  <div className="settings-row-main">
                    <span className="settings-color" style={{ background: c.cor }}></span>
                    <span>{c.nome}</span>
                  </div>
                  <div className="settings-row-actions">
                    <button type="button" className="icon-button" aria-label="Editar categoria" onClick={() => openEditarCategoria(c)}>
                      <EditOutlined />
                    </button>
                    <button type="button" className="icon-button danger" aria-label="Excluir categoria" onClick={() => handleDeleteCategoria(c)}>
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Nenhuma categoria</div>
          )}
        </div>

        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Contas Bancárias</h3>
              <button className="btn-secondary" onClick={openNovaConta} disabled={loading}>
                {loading ? 'Carregando...' : (
                  <>
                    <PlusOutlined /> Nova
                  </>
                )}
              </button>
          </div>
          {loading && contas.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width="100%" height="40px" borderRadius="8px" />
              <Skeleton width="100%" height="40px" borderRadius="8px" />
              <Skeleton width="100%" height="40px" borderRadius="8px" />
            </div>
          ) : contas.length > 0 ? (
            <div>
              {contas.map((c) => (
                <div key={c.id} className="settings-row">
                  <div className="settings-row-main vertical">
                    <span>{c.nome}</span>
                    <span className="settings-row-description">{c.banco} - {c.tipo_conta}</span>
                  </div>
                  <div className="settings-row-actions">
                    <button type="button" className="icon-button" aria-label="Editar conta" onClick={() => openEditarConta(c)}>
                      <EditOutlined />
                    </button>
                    <button type="button" className="icon-button danger" aria-label="Excluir conta" onClick={() => handleDeleteConta(c)}>
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Nenhuma conta cadastrada</div>
          )}
        </div>
      </div>


      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 16 }}>🔒 Privacidade e Dados (LGPD)</h3>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 16 }}>
            Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar,
            exportar e solicitar a exclusão dos seus dados pessoais.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={handleExportData}>
              📥 Exportar meus dados
            </button>
            <button className="btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleDeleteAccount}>
              🗑️ Excluir minha conta
            </button>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              📄 Termos de Uso
            </a>
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              🔐 Política de Privacidade
            </a>
          </div>
        </div>
      </div>

      <Modal
        open={showModalCategoria}
        onCancel={closeCategoriaModal}
        title={editandoCategoria ? 'Editar Categoria' : 'Nova Categoria'}
        footer={null}
        width={440}
        destroyOnHide
        className="modern-form-modal"
      >
        <form onSubmit={handleSubmitCategoria} className="modern-form">
          <div className="form-fields-compact">
            <div className="form-group-compact">
              <label className="form-label-compact">Nome</label>
              <input
                type="text"
                placeholder="Ex: Alimentação, Transporte..."
                value={formCategoria.nome}
                onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })}
                className="form-input-compact"
                required
                autoFocus
              />
            </div>

            <div className="form-group-compact">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label-compact" style={{ margin: 0 }}>Cor da Categoria</label>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: formCategoria.cor || '#3b82f6',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {formCategoria.cor?.toUpperCase() || '#3B82F6'}
                  </span>
                </div>
              </div>

              {/* Paleta rápida com 24 cores */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 6,
                marginBottom: 10
              }}>
                {CORES.map((cor) => {
                  const isSelected = formCategoria.cor?.toLowerCase() === cor.toLowerCase();
                  return (
                    <button
                      key={cor}
                      type="button"
                      title={cor}
                      onClick={() => setFormCategoria({ ...formCategoria, cor })}
                      style={{
                        height: 28,
                        borderRadius: 6,
                        background: cor,
                        border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isSelected ? '0 0 0 2px #3b82f6, 0 2px 6px rgba(0,0,0,0.4)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 'bold',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                      }}
                    >
                      {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>

              {/* Opção de cor personalizada */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))'
              }}>
                <input
                  type="color"
                  value={formCategoria.cor && formCategoria.cor.startsWith('#') && formCategoria.cor.length === 7 ? formCategoria.cor : '#3b82f6'}
                  onChange={(e) => setFormCategoria({ ...formCategoria, cor: e.target.value })}
                  style={{
                    width: 28,
                    height: 28,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: 'transparent',
                    padding: 0
                  }}
                  id="custom-color-input"
                />
                <label htmlFor="custom-color-input" style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', flex: 1, userSelect: 'none' }}>
                  <span style={{ fontWeight: 500, display: 'block' }}>Cor personalizada</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeCategoriaModal}
                style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={showModalConta}
        onCancel={closeContaModal}
        title={editandoConta ? 'Editar Conta' : 'Nova Conta'}
        footer={null}
        width={460}
        destroyOnHide
        className="modern-form-modal"
      >
        <form onSubmit={handleSubmitConta} className="modern-form">
          <div className="form-fields-compact">
            <div className="form-group-compact">
              <label className="form-label-compact">Nome da Conta</label>
              <input
                type="text"
                placeholder="Ex: Conta Principal, Reserva..."
                value={formConta.nome}
                onChange={(e) => setFormConta({ ...formConta, nome: e.target.value })}
                className="form-input-compact"
                required
                autoFocus
              />
            </div>

            <div className="form-row-compact">
              <div className="form-group-compact">
                <label className="form-label-compact">Banco</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Inter..."
                  value={formConta.banco}
                  onChange={(e) => setFormConta({ ...formConta, banco: e.target.value })}
                  className="form-input-compact"
                  required
                />
              </div>

              <div className="form-group-compact">
                <label className="form-label-compact">Tipo de Conta</label>
                <select
                  value={formConta.tipo_conta}
                  onChange={(e) => setFormConta({ ...formConta, tipo_conta: e.target.value })}
                  className="form-select-compact"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="investimento">Investimento</option>
                  <option value="carteira">Carteira</option>
                </select>
              </div>
            </div>

            <div className="form-group-compact">
              <label className="form-label-compact">Saldo Inicial (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formConta.saldo_inicial}
                onChange={(e) => setFormConta({ ...formConta, saldo_inicial: e.target.value })}
                className="form-input-compact"
              />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeContaModal}
                style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 1, height: 38, fontSize: 13, padding: '0 12px' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Configuracoes;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import { formatCurrency } from '../utils/currency';
import { validateRequired } from '../utils/validation';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
       <h1 className="page-title">Configurações</h1>

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
          {categorias.length > 0 ? (
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
          {contas.length > 0 ? (
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

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Ajuda - Importação de CSV</h3>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 12 }}>Para importar extratos bancários, o arquivo CSV deve conter colunas como:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>data</strong> - Data da transação (formato YYYY-MM-DD)</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>descricao</strong> - Descrição da transação</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>valor</strong> - Valor da transação (positivo para receita, negativo para despesa)</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>tipo_pagamento</strong> - (opcional) credito, debito, pix, dinheiro, boleto</li>
          </ul>
          <p style={{ marginTop: 12 }}>As categorias são automaticamente atribuídas quando a descrição contém o nome da categoria.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>WhatsApp Bot</h3>
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            🚧 Em desenvolvimento
          </span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 10,
            marginBottom: 16,
            color: 'var(--text-primary)'
          }}>
            <strong style={{ display: 'block', marginBottom: 4, color: '#60a5fa' }}>ℹ️ Recurso em preparação</strong>
            A integração com o bot do WhatsApp ainda está em fase de desenvolvimento e configuração.
            Em breve você poderá vincular seu número para registrar despesas e receber alertas diretamente pelo WhatsApp!
          </div>

          <p style={{ marginBottom: 12 }}>
            Quando a funcionalidade estiver disponível, você poderá vincular seu WhatsApp para gerenciar suas contas de forma rápida pelo chat.
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled
              onClick={() => {
                message.info('A integração com o WhatsApp Bot ainda está em desenvolvimento e estará disponível em breve!');
              }}
              style={{
                opacity: 0.6,
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
              title="Recurso em desenvolvimento"
            >
              <span>Gerar Código de Vinculação (Em Breve)</span>
            </button>
          </div>

          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Como funcionará após o lançamento:</strong>
            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Você gerará um código seguro de 6 dígitos aqui nas configurações</li>
              <li>Enviará esse código para o número oficial do bot no WhatsApp</li>
              <li>Sua conta será vinculada instantaneamente</li>
            </ol>
            <p style={{ marginTop: 10, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Comandos que estarão disponíveis:</strong> saldo, gastei, recebi, pendentes, gastosfixos, categorias, alertas
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
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
        width={420}
        destroyOnHide
      >
        <form onSubmit={handleSubmitCategoria} style={{ paddingTop: 8 }}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              type="text"
              value={formCategoria.nome}
              onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Cor da Categoria</label>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
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
              gap: 8,
              marginBottom: 12
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
                      height: 32,
                      borderRadius: 8,
                      background: cor,
                      border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected ? '0 0 0 2px #3b82f6, 0 2px 6px rgba(0,0,0,0.4)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 14,
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
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.04))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))'
            }}>
              <input
                type="color"
                value={formCategoria.cor && formCategoria.cor.startsWith('#') && formCategoria.cor.length === 7 ? formCategoria.cor : '#3b82f6'}
                onChange={(e) => setFormCategoria({ ...formCategoria, cor: e.target.value })}
                style={{
                  width: 34,
                  height: 34,
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'transparent',
                  padding: 0
                }}
                id="custom-color-input"
              />
              <label htmlFor="custom-color-input" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', flex: 1, userSelect: 'none' }}>
                <span style={{ fontWeight: 500, display: 'block' }}>Escolher cor personalizada</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Clique no quadrado colorido para abrir o seletor completo
                </span>
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={closeCategoriaModal}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showModalConta}
        onCancel={closeContaModal}
        title={editandoConta ? 'Editar Conta' : 'Nova Conta'}
        footer={null}
        width={480}
        destroyOnHide
      >
        <form onSubmit={handleSubmitConta} style={{ paddingTop: 8 }}>
          <div className="form-group">
            <label className="form-label">Nome da Conta</label>
            <input
              type="text"
              value={formConta.nome}
              onChange={(e) => setFormConta({ ...formConta, nome: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Banco</label>
            <input
              type="text"
              value={formConta.banco}
              onChange={(e) => setFormConta({ ...formConta, banco: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tipo de Conta</label>
            <select
              value={formConta.tipo_conta}
              onChange={(e) => setFormConta({ ...formConta, tipo_conta: e.target.value })}
              className="form-select"
            >
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="investimento">Investimento</option>
              <option value="carteira">Carteira</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Saldo Inicial</label>
            <input
              type="number"
              step="0.01"
              value={formConta.saldo_inicial}
              onChange={(e) => setFormConta({ ...formConta, saldo_inicial: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={closeContaModal}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Configuracoes;

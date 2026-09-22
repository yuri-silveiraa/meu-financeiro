import { useState, useEffect } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import { formatCurrency } from '../utils/currency';
import { validateRequired } from '../utils/validation';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CORES = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

function Configuracoes() {
  const { user } = useAuth();
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
        <h3 style={{ marginBottom: 16 }}>WhatsApp Bot</h3>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 12 }}>Vincule seu WhatsApp para registrar despesas e receber alertas pelo chat.</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-primary" onClick={async () => {
              const phone = prompt('Digite seu número do WhatsApp (com código do país, ex: 5511999999999):');
              if (phone) {
                try {
                  const data = await api.gerarCodigoVinculacao(phone);
                  if (data.code) {
                    alert(`Código gerado: ${data.code}\n\nEnvie este código para o bot no WhatsApp.\nExpira em ${data.expiresIn}.`);
                  } else {
                    alert('Erro ao gerar código. Tente novamente.');
                  }
                } catch (err) {
                  alert('Erro ao conectar com o servidor.');
                }
              }
            }}>Gerar Código de Vinculação</button>
          </div>
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Como vincular:</strong>
            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Clique em "Gerar Código de Vinculação" acima</li>
              <li>Anote o código de 6 dígitos</li>
              <li>Abra o WhatsApp e envie o código para o bot</li>
              <li>Pronto! Agora você pode usar comandos no WhatsApp</li>
            </ol>
            <p style={{ marginTop: 10, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Comandos disponíveis:</strong> saldo, gastei, recebi, pendentes, gastosfixos, categorias, alertas
            </p>
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
            <label className="form-label">Cor</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setFormCategoria({ ...formCategoria, cor })}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: cor,
                    border: formCategoria.cor === cor ? '3px solid #1f2937' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
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

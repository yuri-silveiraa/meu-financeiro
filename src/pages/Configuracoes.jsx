import { useState, useEffect } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { validateRequired } from '../utils/validation';

const CORES = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

function Configuracoes() {
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [showModalConta, setShowModalConta] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
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
        window.api.getCategorias(),
        window.api.getContas()
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
     
     // Validate form
     const nomeError = validateRequired(formCategoria.nome, 'Nome');
     if (nomeError) {
       alert(nomeError);
       return;
     }
     
     if (editandoCategoria) {
       await window.api.updateCategoria({ ...formCategoria, id: editandoCategoria.id, icone: editandoCategoria.icone || 'folder' });
     } else {
       await window.api.addCategoria(formCategoria);
     }

     closeCategoriaModal();
     loadData();
   };

   const handleDeleteCategoria = async (categoria) => {
     const message = `Excluir a categoria "${categoria.nome}"? Transações, metas e gastos fixos ligados a ela ficarão sem categoria.`;
     if (!confirm(message)) return;

     await window.api.deleteCategoria(categoria.id);
     loadData();
   };

   const handleSubmitConta = async (e) => {
     e.preventDefault();
     
     // Validate form
     const nomeError = validateRequired(formConta.nome, 'Nome da Conta');
     if (nomeError) {
       alert(nomeError);
       return;
     }
     
     const bancoError = validateRequired(formConta.banco, 'Banco');
     if (bancoError) {
       alert(bancoError);
       return;
     }
     
     await window.api.addConta({ ...formConta, saldo_inicial: parseFloat(formConta.saldo_inicial || 0) });
     setShowModalConta(false);
     setFormConta({ nome: '', banco: '', tipo_conta: 'corrente', saldo_inicial: '' });
     loadData();
   };

   return (
     <div>
       {error && (
         <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
           {error}
         </div>
       )}
       <h1 className="page-title">Configurações</h1>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
              <button className="btn-secondary" onClick={() => setShowModalConta(true)} disabled={loading}>
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
                <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 500 }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{c.banco} - {c.tipo_conta}</div>
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
        <div style={{ fontSize: 14, color: '#374151' }}>
          <p style={{ marginBottom: 12 }}>Para importar extratos bancários, o arquivo CSV deve conter colunas como:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>data</strong> - Data da transação (formato YYYY-MM-DD)</li>
            <li><strong>descricao</strong> - Descrição da transação</li>
            <li><strong>valor</strong> - Valor da transação (positivo para receita, negativo para despesa)</li>
            <li><strong>tipo_pagamento</strong> - (opcional) credito, debito, pix, dinheiro, boleto</li>
          </ul>
          <p style={{ marginTop: 12 }}>As categorias são automaticamente atribuídas quando a descrição contém o nome da categoria.</p>
        </div>
      </div>

      {showModalCategoria && (
        <div className="modal-overlay" onClick={closeCategoriaModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editandoCategoria ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            </div>
            <form onSubmit={handleSubmitCategoria}>
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
                <div style={{ display: 'flex', gap: 8 }}>
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
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={closeCategoriaModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalConta && (
        <div className="modal-overlay" onClick={() => setShowModalConta(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nova Conta</h2>
            </div>
            <form onSubmit={handleSubmitConta}>
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
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModalConta(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Configuracoes;

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { Modal, message } from 'antd';
import { api } from '../../services/api';
import { validateTransacao } from '../../utils/validation';
import { initialForm, initialFilters } from './constants';

const TransacoesContext = createContext(null);

export function TransacoesProvider({ children }) {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [filtros, setFiltros] = useState(initialFilters);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, c, ct, cr] = await Promise.all([
        api.getTransacoes(filtros),
        api.getCategorias(),
        api.getContas(),
        api.getCartoes(),
      ]);
      setTransacoes(t);
      setCategorias(c);
      setContas(ct);
      setCartoes(cr);
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

  const handleTogglePago = useCallback(
    async (id) => {
      try {
        await api.togglePago(id);
        loadData();
      } catch (err) {
        console.error('Erro ao alterar status:', err);
        message.error('Erro ao alterar status de pagamento');
      }
    },
    [loadData]
  );

  const handleEdit = useCallback((transacao) => {
    setEditando(transacao);
    setForm({
      data: transacao.data ? transacao.data.split('T')[0] : '',
      descricao: transacao.descricao || '',
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      tipo_pagamento: transacao.tipo_pagamento || 'debito',
      categoria_id: transacao.categoria_id || '',
      conta_id: transacao.conta_id || '',
      cartao_id: transacao.cartao_id || '',
      total_parcelas: transacao.total_parcelas || 1,
      pago: transacao.pago || false,
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id, transacaoObj = null) => {
      const tx = transacaoObj || editando || transacoes.find((t) => t.id === id);

      if (tx?.compra_grupo_id) {
        Modal.confirm({
          title: 'Excluir compra parcelada',
          content: `Esta transação faz parte de um parcelamento (${tx.parcela_atual}/${tx.total_parcelas}). Como você deseja excluir?`,
          okText: 'Excluir Todas',
          okType: 'danger',
          cancelText: 'Apenas Esta',
          onOk: async () => {
            try {
              await api.deleteTransacaoComModo(id, 'all');
              setShowModal(false);
              setEditando(null);
              loadData();
              message.success('Todas as parcelas foram excluídas');
            } catch (err) {
              message.error('Erro ao excluir parcelas');
            }
          },
          onCancel: async () => {
            try {
              await api.deleteTransacaoComModo(id, 'single');
              setShowModal(false);
              setEditando(null);
              loadData();
              message.success('Parcela excluída com sucesso');
            } catch (err) {
              message.error('Erro ao excluir transação');
            }
          },
        });
        return;
      }

      Modal.confirm({
        title: 'Excluir transação',
        content: 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
        okText: 'Excluir',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk: async () => {
          try {
            await api.deleteTransacao(id);
            setShowModal(false);
            setEditando(null);
            loadData();
            message.success('Transação excluída com sucesso');
          } catch (err) {
            console.error('Erro ao excluir transação:', err);
            message.error('Erro ao excluir transação');
          }
        },
      });
    },
    [loadData, editando, transacoes]
  );

  const resetForm = () => {
    setForm(initialForm());
    setEditando(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateTransacao(form);
    if (Object.keys(errors).length > 0) {
      message.warning(Object.values(errors)[0]);
      return;
    }

    const dados = {
      ...form,
      valor: parseFloat(form.valor),
      conta_id: form.conta_id ? parseInt(form.conta_id, 10) : null,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id, 10) : null,
      cartao_id: form.tipo_pagamento === 'credito' && form.cartao_id ? parseInt(form.cartao_id, 10) : null,
      total_parcelas: form.tipo_pagamento === 'credito' && !editando ? parseInt(form.total_parcelas, 10) || 1 : 1,
      pago: form.tipo === 'receita' ? true : form.pago,
    };

    try {
      if (editando) {
        await api.updateTransacao(editando.id, dados);
        message.success('Transação atualizada com sucesso');
      } else {
        await api.addTransacao(dados);
        message.success('Transação criada com sucesso');
      }

      setShowModal(false);
      setEditando(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      message.error('Erro ao salvar transação');
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const transacoesImportadas = results.data
          .map((row) => ({
            data: row.data || row.Data || new Date().toISOString().split('T')[0],
            descricao: row.descricao || row.Descricao || row.description || '',
            valor: Math.abs(parseFloat(row.valor || row.Valor || row.value || 0)),
            tipo: parseFloat(row.valor || row.Valor || row.value) > 0 ? 'receita' : 'despesa',
            tipo_pagamento: (row.tipo_pagamento || row.tipo || 'debito').toLowerCase(),
            descricao_lower: (row.descricao || row.Descricao || '').toLowerCase(),
            pago: parseFloat(row.valor || row.Valor || row.value) > 0,
          }))
          .map((transacao) => {
            const categoria = categorias.find((c) =>
              transacao.descricao_lower.includes(c.nome.toLowerCase())
            );
            return { ...transacao, categoria_id: categoria?.id || null };
          });

        let importadas = 0;
        let erros = 0;
        for (const transacao of transacoesImportadas) {
          try {
            await api.addTransacao(transacao);
            importadas++;
          } catch (err) {
            console.error('Erro ao importar transação:', err);
            erros++;
          }
        }

        loadData();
        if (erros > 0) {
          message.warning(`${importadas} transações importadas (${erros} com erro)`);
        } else {
          message.success(`${importadas} transações importadas com sucesso!`);
        }
      },
    });
    e.target.value = '';
  };

  const clearFilters = () => {
    setFiltros(initialFilters());
    setQuickSearch('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filtros.tipo) count++;
    if (filtros.pago !== '') count++;
    if (filtros.categoriaId) count++;
    if (filtros.contaId) count++;
    if (filtros.cartaoId) count++;
    return count;
  }, [filtros]);

  const filteredTransacoes = useMemo(() => {
    if (!quickSearch) return transacoes;
    const q = quickSearch.toLowerCase();
    return transacoes.filter(
      (t) =>
        (t.descricao || '').toLowerCase().includes(q) ||
        (t.categoria_nome || '').toLowerCase().includes(q) ||
        (t.conta_nome || '').toLowerCase().includes(q) ||
        (t.cartao_nome || '').toLowerCase().includes(q)
    );
  }, [transacoes, quickSearch]);

  const totalReceitas = useMemo(
    () =>
      transacoes
        .filter((t) => t.tipo === 'receita' && t.pago)
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
    [transacoes]
  );

  const totalDespesasPagas = useMemo(
    () =>
      transacoes
        .filter((t) => t.tipo === 'despesa' && t.pago)
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
    [transacoes]
  );

  const totalDespesasNaoPagas = useMemo(
    () =>
      transacoes
        .filter((t) => t.tipo === 'despesa' && !t.pago)
        .reduce((sum, t) => sum + parseFloat(t.valor), 0),
    [transacoes]
  );

  const saldoAtual = totalReceitas - totalDespesasPagas;
  const saldoProjetado = totalReceitas - totalDespesasPagas - totalDespesasNaoPagas;

  const value = {
    transacoes,
    categorias,
    contas,
    cartoes,
    filtros,
    setFiltros,
    showModal,
    setShowModal,
    showFilterModal,
    setShowFilterModal,
    editando,
    setEditando,
    quickSearch,
    setQuickSearch,
    form,
    setForm,
    loading,
    error,
    activeFiltersCount,
    filteredTransacoes,
    totalReceitas,
    totalDespesasPagas,
    totalDespesasNaoPagas,
    saldoAtual,
    saldoProjetado,
    loadData,
    handleTogglePago,
    handleEdit,
    handleDelete,
    resetForm,
    openCreateModal,
    handleSubmit,
    handleImportCSV,
    clearFilters,
  };

  return <TransacoesContext.Provider value={value}>{children}</TransacoesContext.Provider>;
}

export function useTransacoes() {
  const context = useContext(TransacoesContext);
  if (!context) {
    throw new Error('useTransacoes deve ser usado dentro de um TransacoesProvider');
  }
  return context;
}

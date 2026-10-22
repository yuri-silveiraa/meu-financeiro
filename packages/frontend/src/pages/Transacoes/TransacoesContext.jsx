import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal, message } from 'antd';
import { api } from '../../services/api';
import { validateTransacao } from '../../utils/validation';
import { initialForm, initialFilters, formatInputDate } from './constants';

const TransacoesContext = createContext(null);

export function TransacoesProvider({ children }) {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const today = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [ano, setAno] = useState(today.getFullYear());
  const [filtros, setFiltros] = useState(initialFilters);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openCreateModal) {
      setForm(initialForm());
      setEditando(null);
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadData = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
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
      if (!silent) {
        setLoading(false);
      }
    }
  }, [filtros]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePago = useCallback(
    async (id) => {
      // 1. Atualização otimista imediata para não perder a posição do scroll nem piscar a tela
      setTransacoes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, pago: !t.pago } : t))
      );

      try {
        const res = await api.togglePago(id);
        if (res && typeof res.pago === 'boolean') {
          setTransacoes((prev) =>
            prev.map((t) => (t.id === id ? { ...t, pago: res.pago } : t))
          );
        }
      } catch (err) {
        console.error('Erro ao alterar status:', err);
        message.error('Erro ao alterar status de pagamento');
        // Rollback do status em caso de falha
        setTransacoes((prev) =>
          prev.map((t) => (t.id === id ? { ...t, pago: !t.pago } : t))
        );
      }
    },
    []
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
      pago: form.tipo === 'receita'
        ? true
        : (form.tipo_pagamento === 'credito' ? false : (form.pago !== undefined ? form.pago : true)),
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


  const irParaMesAnterior = useCallback(() => {
    let novoMes = mes - 1;
    let novoAno = ano;
    if (novoMes < 1) {
      novoMes = 12;
      novoAno = ano - 1;
    }
    setMes(novoMes);
    setAno(novoAno);
    const firstDay = new Date(novoAno, novoMes - 1, 1);
    const lastDay = new Date(novoAno, novoMes, 0);
    setFiltros((prev) => ({
      ...prev,
      dataInicio: formatInputDate(firstDay),
      dataFim: formatInputDate(lastDay),
    }));
  }, [mes, ano]);

  const irParaProximoMes = useCallback(() => {
    let novoMes = mes + 1;
    let novoAno = ano;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno = ano + 1;
    }
    setMes(novoMes);
    setAno(novoAno);
    const firstDay = new Date(novoAno, novoMes - 1, 1);
    const lastDay = new Date(novoAno, novoMes, 0);
    setFiltros((prev) => ({
      ...prev,
      dataInicio: formatInputDate(firstDay),
      dataFim: formatInputDate(lastDay),
    }));
  }, [mes, ano]);

  const clearFilters = () => {
    const curDate = new Date();
    setMes(curDate.getMonth() + 1);
    setAno(curDate.getFullYear());
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

  const totalReceitasPendentes = useMemo(
    () =>
      transacoes
        .filter((t) => t.tipo === 'receita' && !t.pago)
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
  const saldoProjetado = (totalReceitas + totalReceitasPendentes) - (totalDespesasPagas + totalDespesasNaoPagas);

  const pendentesCount = useMemo(
    () => filteredTransacoes.filter((t) => !t.pago).length,
    [filteredTransacoes]
  );

  const hasPendentes = pendentesCount > 0;

  const handleToggleAllPago = useCallback(() => {
    if (!filteredTransacoes || filteredTransacoes.length === 0) return;

    if (hasPendentes) {
      Modal.confirm({
        title: 'Marcar todas como pagas/recebidas',
        content: `Deseja marcar todas as ${pendentesCount} transações pendentes como pagas/recebidas?`,
        okText: 'Sim, marcar todas',
        cancelText: 'Cancelar',
        onOk: async () => {
          const idsToUpdate = filteredTransacoes.filter((t) => !t.pago).map((t) => t.id);
          setTransacoes((prev) =>
            prev.map((t) => (idsToUpdate.includes(t.id) ? { ...t, pago: true } : t))
          );

          try {
            await api.togglePagoLote(idsToUpdate, true);
            message.success('Todas as transações foram marcadas como pagas/recebidas');
          } catch (err) {
            console.error('Erro ao marcar lote:', err);
            message.error('Erro ao atualizar status das transações');
            setTransacoes((prev) =>
              prev.map((t) => (idsToUpdate.includes(t.id) ? { ...t, pago: false } : t))
            );
          }
        },
      });
    } else {
      Modal.confirm({
        title: 'Desmarcar todas as transações',
        content: `Todas as transações já estão marcadas como pagas/recebidas. Deseja desmarcá-las e torná-las pendentes?`,
        okText: 'Sim, desmarcar todas',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk: async () => {
          const idsToUpdate = filteredTransacoes.map((t) => t.id);
          setTransacoes((prev) =>
            prev.map((t) => (idsToUpdate.includes(t.id) ? { ...t, pago: false } : t))
          );

          try {
            await api.togglePagoLote(idsToUpdate, false);
            message.success('Todas as transações foram marcadas como pendentes');
          } catch (err) {
            console.error('Erro ao desmarcar lote:', err);
            message.error('Erro ao atualizar status das transações');
            setTransacoes((prev) =>
              prev.map((t) => (idsToUpdate.includes(t.id) ? { ...t, pago: true } : t))
            );
          }
        },
      });
    }
  }, [filteredTransacoes, hasPendentes, pendentesCount]);

  const value = {
    transacoes,
    categorias,
    contas,
    cartoes,
    filtros,
    setFiltros,
    mes,
    ano,
    setMes,
    setAno,
    irParaMesAnterior,
    irParaProximoMes,
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
    pendentesCount,
    hasPendentes,
    totalReceitas,
    totalReceitasPendentes,
    totalDespesasPagas,
    totalDespesasNaoPagas,
    saldoAtual,
    saldoProjetado,
    loadData,
    handleTogglePago,
    handleToggleAllPago,
    handleEdit,
    handleDelete,
    resetForm,
    openCreateModal,
    handleSubmit,
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

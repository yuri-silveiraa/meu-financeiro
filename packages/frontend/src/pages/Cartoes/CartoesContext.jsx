import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Form, message } from 'antd';
import { api } from '../../services/api';

const CartoesContext = createContext(null);

export function CartoesProvider({ children }) {
  const [cartoes, setCartoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [selectedCartaoId, setSelectedCartaoId] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [faturaDetalhada, setFaturaDetalhada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFaturas, setLoadingFaturas] = useState(false);

  // Modais
  const [isModalCartaoOpen, setIsModalCartaoOpen] = useState(false);
  const [editingCartao, setEditingCartao] = useState(null);
  const [formCartao] = Form.useForm();

  const [isModalPagarOpen, setIsModalPagarOpen] = useState(false);
  const [faturaParaPagar, setFaturaParaPagar] = useState(null);
  const [formPagar] = Form.useForm();
  const [payingLoading, setPayingLoading] = useState(false);

  const loadCartoes = useCallback(async () => {
    setLoading(true);
    try {
      const [cartoesData, contasData] = await Promise.all([
        api.getCartoes(),
        api.getContas(),
      ]);
      setCartoes(cartoesData);
      setContas(contasData);

      if (cartoesData.length > 0) {
        setSelectedCartaoId((prev) => {
          const stillExists = cartoesData.some((c) => c.id === prev);
          return stillExists ? prev : cartoesData[0].id;
        });
      } else {
        setSelectedCartaoId(null);
        setFaturas([]);
        setFaturaDetalhada(null);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Erro ao carregar cartões');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartoes();
  }, [loadCartoes]);

  // Carregar faturas do cartão selecionado
  const loadFaturas = useCallback(async (cartaoId) => {
    if (!cartaoId) return;
    setLoadingFaturas(true);
    try {
      const data = await api.getFaturas(cartaoId);
      setFaturas(data);

      // Carregar a fatura do mês atual ou a fatura aberta mais próxima cronologicamente
      if (data.length > 0) {
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1;

        const faturaMesAtual = data.find((f) => f.fatura_ano === anoAtual && f.fatura_mes === mesAtual);
        const faturaAberta = faturaMesAtual || [...data].reverse().find((f) => !f.pago) || data[0];
        const detalhe = await api.getFaturaDetalhada(cartaoId, faturaAberta.fatura_ano, faturaAberta.fatura_mes);
        setFaturaDetalhada(detalhe);
      } else {
        setFaturaDetalhada(null);
      }
    } catch (err) {
      console.error(err);
      message.error('Erro ao carregar faturas');
    } finally {
      setLoadingFaturas(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCartaoId) {
      loadFaturas(selectedCartaoId);
    }
  }, [selectedCartaoId, loadFaturas]);

  const handleSelectFatura = async (fatura) => {
    try {
      setLoadingFaturas(true);
      const detalhe = await api.getFaturaDetalhada(selectedCartaoId, fatura.fatura_ano, fatura.fatura_mes);
      setFaturaDetalhada(detalhe);
    } catch (err) {
      console.error(err);
      message.error('Erro ao carregar detalhes da fatura');
    } finally {
      setLoadingFaturas(false);
    }
  };

  const handleOpenModalCartao = (cartao = null) => {
    setEditingCartao(cartao);
    if (cartao) {
      formCartao.setFieldsValue({
        nome: cartao.nome,
        bandeira: cartao.bandeira || 'mastercard',
        limite: cartao.limite,
        dia_fechamento: cartao.dia_fechamento,
        dia_vencimento: cartao.dia_vencimento,
        conta_padrao_id: cartao.conta_padrao_id,
        cor: cartao.cor || '#6366f1',
      });
    } else {
      formCartao.resetFields();
      formCartao.setFieldsValue({
        bandeira: 'mastercard',
        limite: 1000,
        dia_fechamento: 25,
        dia_vencimento: 5,
        cor: '#6366f1',
      });
    }
    setIsModalCartaoOpen(true);
  };

  const handleSaveCartao = async () => {
    try {
      const values = await formCartao.validateFields();
      if (editingCartao) {
        await api.updateCartao(editingCartao.id, values);
        message.success('Cartão atualizado com sucesso!');
      } else {
        const novo = await api.addCartao(values);
        message.success('Cartão criado com sucesso!');
        setSelectedCartaoId(novo.id);
      }
      setIsModalCartaoOpen(false);
      loadCartoes();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || 'Erro ao salvar cartão');
    }
  };

  const handleDeleteCartao = async (id) => {
    try {
      await api.deleteCartao(id);
      message.success('Cartão removido com sucesso!');
      loadCartoes();
    } catch (err) {
      message.error(err.message || 'Erro ao remover cartão');
    }
  };

  const handleOpenPagarModal = (fatura) => {
    setFaturaParaPagar(fatura);
    const cartaoAtual = cartoes.find((c) => c.id === selectedCartaoId);
    formPagar.setFieldsValue({
      conta_id: cartaoAtual?.conta_padrao_id || (contas.length > 0 ? contas[0].id : null),
    });
    setIsModalPagarOpen(true);
  };

  const handleConfirmPagar = async () => {
    try {
      const values = await formPagar.validateFields();
      setPayingLoading(true);
      await api.pagarFatura(selectedCartaoId, faturaParaPagar.fatura_ano, faturaParaPagar.fatura_mes, {
        conta_id: values.conta_id,
      });
      message.success('Fatura liquidada com sucesso!');
      setIsModalPagarOpen(false);
      loadCartoes();
      loadFaturas(selectedCartaoId);
    } catch (err) {
      message.error(err.message || 'Erro ao pagar fatura');
    } finally {
      setPayingLoading(false);
    }
  };

  const selectedCard = useMemo(
    () => cartoes.find((c) => c.id === selectedCartaoId),
    [cartoes, selectedCartaoId]
  );

  const value = {
    cartoes,
    contas,
    selectedCartaoId,
    setSelectedCartaoId,
    faturas,
    faturaDetalhada,
    loading,
    loadingFaturas,
    payingLoading,
    isModalCartaoOpen,
    setIsModalCartaoOpen,
    editingCartao,
    formCartao,
    isModalPagarOpen,
    setIsModalPagarOpen,
    faturaParaPagar,
    formPagar,
    selectedCard,
    loadCartoes,
    loadFaturas,
    handleSelectFatura,
    handleOpenModalCartao,
    handleSaveCartao,
    handleDeleteCartao,
    handleOpenPagarModal,
    handleConfirmPagar,
  };

  return <CartoesContext.Provider value={value}>{children}</CartoesContext.Provider>;
}

export function useCartoes() {
  const context = useContext(CartoesContext);
  if (!context) {
    throw new Error('useCartoes deve ser usado dentro de um CartoesProvider');
  }
  return context;
}

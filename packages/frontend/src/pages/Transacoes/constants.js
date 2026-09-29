export const initialForm = () => ({
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: '',
  tipo: 'despesa',
  tipo_pagamento: 'debito',
  categoria_id: '',
  conta_id: '',
  cartao_id: '',
  total_parcelas: 1,
  pago: false,
});

export const formatInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    dataInicio: formatInputDate(firstDay),
    dataFim: formatInputDate(lastDay),
  };
};

export const initialFilters = () => ({
  ...getCurrentMonthRange(),
  tipo: '',
  pago: '',
  categoriaId: '',
  contaId: '',
  cartaoId: '',
});

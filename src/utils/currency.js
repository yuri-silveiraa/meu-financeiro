export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const parseCurrency = (formattedValue) => {
  return parseFloat(formattedValue.replace(/[^\d,-]/g, '').replace(',', '.'));
};
export const validateTransacao = (form) => {
  const errors = {};

  if (!form.data) {
    errors.data = 'Data é obrigatória';
  }

  if (!form.descricao || form.descricao.trim() === '') {
    errors.descricao = 'Descrição é obrigatória';
  }

  if (!form.valor || isNaN(parseFloat(form.valor)) || parseFloat(form.valor) <= 0) {
    errors.valor = 'Valor deve ser um número maior que zero';
  }

  if (!form.tipo) {
    errors.tipo = 'Tipo é obrigatório';
  }

  if (form.tipo === 'despesa' && !form.tipo_pagamento) {
    errors.tipo_pagamento = 'Tipo de pagamento é obrigatório para despesas';
  }

  if (!form.categoria_id) {
    errors.categoria_id = 'Categoria é obrigatória';
  }

  if (!form.conta_id) {
    errors.conta_id = 'Conta é obrigatória';
  }

  return errors;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} é obrigatório`;
  }
  return null;
};

export const validateMinValue = (value, min, fieldName) => {
  if (value === '' || value === null || value === undefined) {
    return null; // Let required validation handle empty values
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue < min) {
    return `${fieldName} deve ser maior ou igual a ${min}`;
  }
  return null;
};
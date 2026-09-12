import { describe, it, expect } from 'vitest';
import { validateRequired, validateMinValue, validateTransacao } from '../validation';

describe('validateRequired', () => {
  it('returns error for null', () => {
    expect(validateRequired(null, 'Campo')).toBe('Campo é obrigatório');
  });

  it('returns error for empty string', () => {
    expect(validateRequired('', 'Campo')).toBe('Campo é obrigatório');
  });

  it('returns null for valid value', () => {
    expect(validateRequired('texto', 'Campo')).toBeNull();
  });

  it('returns error for zero', () => {
    expect(validateRequired(0, 'Campo')).toBe('Campo é obrigatório');
  });
});

describe('validateMinValue', () => {
  it('returns error when below min', () => {
    expect(validateMinValue(5, 10, 'Valor')).toBe('Valor deve ser maior ou igual a 10');
  });

  it('returns null when at min', () => {
    expect(validateMinValue(10, 10, 'Valor')).toBeNull();
  });

  it('returns null when above min', () => {
    expect(validateMinValue(15, 10, 'Valor')).toBeNull();
  });

  it('returns null for null/undefined (passes through)', () => {
    expect(validateMinValue(null, 10, 'Valor')).toBeNull();
  });
});

describe('validateTransacao', () => {
  it('returns no errors for valid form', () => {
    const form = {
      data: '2026-01-15',
      descricao: 'Teste',
      valor: 100,
      tipo: 'despesa',
      tipo_pagamento: 'pix',
      categoria_id: 1,
      conta_id: 1,
    };
    expect(validateTransacao(form)).toEqual({});
  });

  it('returns error for missing data', () => {
    expect(validateTransacao({})).toHaveProperty('data');
  });

  it('returns error for missing descricao', () => {
    expect(validateTransacao({ data: '2026-01-15' })).toHaveProperty('descricao');
  });

  it('returns error for missing valor', () => {
    expect(validateTransacao({ data: '2026-01-15', descricao: 'Teste' })).toHaveProperty('valor');
  });

  it('returns error for missing tipo', () => {
    expect(validateTransacao({ data: '2026-01-15', descricao: 'Teste', valor: 100 })).toHaveProperty('tipo');
  });

  it('returns error for missing tipo_pagamento on despesa', () => {
    const result = validateTransacao({
      data: '2026-01-15',
      descricao: 'Teste',
      valor: 100,
      tipo: 'despesa',
    });
    expect(result).toHaveProperty('tipo_pagamento');
  });

  it('does not require tipo_pagamento for receita', () => {
    const result = validateTransacao({
      data: '2026-01-15',
      descricao: 'Teste',
      valor: 100,
      tipo: 'receita',
      categoria_id: 1,
      conta_id: 1,
    });
    expect(result).not.toHaveProperty('tipo_pagamento');
  });

  it('returns error for missing categoria_id', () => {
    const result = validateTransacao({
      data: '2026-01-15',
      descricao: 'Teste',
      valor: 100,
      tipo: 'despesa',
      tipo_pagamento: 'pix',
    });
    expect(result).toHaveProperty('categoria_id');
  });

  it('returns error for missing conta_id', () => {
    const result = validateTransacao({
      data: '2026-01-15',
      descricao: 'Teste',
      valor: 100,
      tipo: 'despesa',
      tipo_pagamento: 'pix',
      categoria_id: 1,
    });
    expect(result).toHaveProperty('conta_id');
  });
});

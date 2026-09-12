import {
  validateRequired,
  validateString,
  validateNumber,
  validateInteger,
  validateDate,
  validateEnum,
  validate,
} from '../validate.js';

describe('validateRequired', () => {
  it('returns error for null', () => {
    expect(validateRequired(null, 'Campo')).toBe('Campo é obrigatório');
  });

  it('returns error for undefined', () => {
    expect(validateRequired(undefined, 'Campo')).toBe('Campo é obrigatório');
  });

  it('returns error for empty string', () => {
    expect(validateRequired('', 'Campo')).toBe('Campo é obrigatório');
  });

  it('returns error for whitespace only', () => {
    expect(validateRequired('   ', 'Campo')).toBe('Campo é obrigatório');
  });

  it('returns null for valid string', () => {
    expect(validateRequired('valor', 'Campo')).toBeNull();
  });

  it('returns null for zero (falsy but valid)', () => {
    expect(validateRequired(0, 'Campo')).toBeNull();
  });

  it('returns null for false (falsy but valid)', () => {
    expect(validateRequired(false, 'Campo')).toBeNull();
  });
});

describe('validateString', () => {
  it('returns error for null', () => {
    expect(validateString(null, 'Nome')).toBe('Nome é obrigatório');
  });

  it('returns error for non-string', () => {
    expect(validateString(123, 'Nome')).toBe('Nome deve ser um texto');
  });

  it('returns error for string shorter than min', () => {
    expect(validateString('ab', 'Nome', { min: 3 })).toBe('Nome deve ter pelo menos 3 caractere(s)');
  });

  it('returns error for string longer than max', () => {
    expect(validateString('a'.repeat(256), 'Nome', { max: 255 })).toBe('Nome deve ter no máximo 255 caracteres');
  });

  it('returns null for valid string', () => {
    expect(validateString('teste', 'Nome')).toBeNull();
  });

  it('returns null for string at exact min', () => {
    expect(validateString('abc', 'Nome', { min: 3 })).toBeNull();
  });

  it('returns null for string at exact max', () => {
    expect(validateString('a'.repeat(100), 'Nome', { max: 100 })).toBeNull();
  });
});

describe('validateNumber', () => {
  it('returns error for null', () => {
    expect(validateNumber(null, 'Valor')).toBe('Valor é obrigatório');
  });

  it('returns error for empty string', () => {
    expect(validateNumber('', 'Valor')).toBe('Valor é obrigatório');
  });

  it('returns error for non-numeric string', () => {
    expect(validateNumber('abc', 'Valor')).toBe('Valor deve ser um número');
  });

  it('returns error when below min', () => {
    expect(validateNumber(5, 'Valor', { min: 10 })).toBe('Valor deve ser pelo menos 10');
  });

  it('returns error when above max', () => {
    expect(validateNumber(100, 'Valor', { max: 50 })).toBe('Valor deve ser no máximo 50');
  });

  it('returns null for valid number', () => {
    expect(validateNumber(42, 'Valor')).toBeNull();
  });

  it('returns null for number at exact min', () => {
    expect(validateNumber(10, 'Valor', { min: 10 })).toBeNull();
  });

  it('returns null for zero', () => {
    expect(validateNumber(0, 'Valor')).toBeNull();
  });
});

describe('validateInteger', () => {
  it('returns error for null', () => {
    expect(validateInteger(null, 'Dia')).toBe('Dia é obrigatório');
  });

  it('returns error for float', () => {
    expect(validateInteger(3.14, 'Dia')).toBe('Dia deve ser um número inteiro');
  });

  it('returns error for numeric string with decimal', () => {
    expect(validateInteger('3.14', 'Dia')).toBe('Dia deve ser um número inteiro');
  });

  it('returns null for integer', () => {
    expect(validateInteger(31, 'Dia')).toBeNull();
  });

  it('returns null for integer string', () => {
    expect(validateInteger('31', 'Dia')).toBeNull();
  });

  it('returns error when below min', () => {
    expect(validateInteger(0, 'Dia', { min: 1 })).toBe('Dia deve ser pelo menos 1');
  });

  it('returns error when above max', () => {
    expect(validateInteger(32, 'Dia', { max: 31 })).toBe('Dia deve ser no máximo 31');
  });
});

describe('validateDate', () => {
  it('returns error for null', () => {
    expect(validateDate(null, 'Data')).toBe('Data é obrigatório');
  });

  it('returns error for invalid format', () => {
    expect(validateDate('15/01/2026', 'Data')).toBe('Data deve ter formato AAAA-MM-DD');
  });

  it('returns error for impossible date', () => {
    expect(validateDate('2026-02-30', 'Data')).toBe('Data não é uma data válida');
  });

  it('returns null for valid date', () => {
    expect(validateDate('2026-01-15', 'Data')).toBeNull();
  });
});

describe('validateEnum', () => {
  it('returns null for null value', () => {
    expect(validateEnum(null, 'Tipo', ['a', 'b'])).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(validateEnum('', 'Tipo', ['a', 'b'])).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(validateEnum(undefined, 'Tipo', ['a', 'b'])).toBeNull();
  });

  it('returns error for invalid value', () => {
    expect(validateEnum('c', 'Tipo', ['a', 'b'])).toBe('Tipo deve ser um de: a, b');
  });

  it('returns null for valid value', () => {
    expect(validateEnum('a', 'Tipo', ['a', 'b'])).toBeNull();
  });
});

describe('validate', () => {
  it('returns null when no errors', () => {
    expect(validate([
      { check: false, message: 'error1' },
      { check: false, message: 'error2' },
    ])).toBeNull();
  });

  it('returns array of error messages when errors exist', () => {
    const result = validate([
      { check: true, message: 'error1' },
      { check: false, message: 'error2' },
      { check: true, message: 'error3' },
    ]);
    expect(result).toEqual(['error1', 'error3']);
  });

  it('returns null for empty array', () => {
    expect(validate([])).toBeNull();
  });
});

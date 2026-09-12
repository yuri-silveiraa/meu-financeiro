export function validateRequired(value, fieldName) {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} é obrigatório`;
  }
  return null;
}

export function validateString(value, fieldName, { min = 1, max = 255 } = {}) {
  const reqErr = validateRequired(value, fieldName);
  if (reqErr) return reqErr;
  if (typeof value !== 'string') return `${fieldName} deve ser um texto`;
  if (value.length < min) return `${fieldName} deve ter pelo menos ${min} caractere(s)`;
  if (value.length > max) return `${fieldName} deve ter no máximo ${max} caracteres`;
  return null;
}

export function validateNumber(value, fieldName, { min, max } = {}) {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} é obrigatório`;
  }
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} deve ser um número`;
  if (min !== undefined && num < min) return `${fieldName} deve ser pelo menos ${min}`;
  if (max !== undefined && num > max) return `${fieldName} deve ser no máximo ${max}`;
  return null;
}

export function validateInteger(value, fieldName, { min, max } = {}) {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} é obrigatório`;
  }
  const num = parseInt(value, 10);
  if (isNaN(num) || num !== Number(value)) return `${fieldName} deve ser um número inteiro`;
  if (min !== undefined && num < min) return `${fieldName} deve ser pelo menos ${min}`;
  if (max !== undefined && num > max) return `${fieldName} deve ser no máximo ${max}`;
  return null;
}

export function validateDate(value, fieldName) {
  const reqErr = validateRequired(value, fieldName);
  if (reqErr) return reqErr;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${fieldName} deve ter formato AAAA-MM-DD`;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return `${fieldName} não é uma data válida`;
  }
  return null;
}

export function validateEnum(value, fieldName, allowed) {
  if (value === undefined || value === null || value === '') return null;
  if (!allowed.includes(value)) return `${fieldName} deve ser um de: ${allowed.join(', ')}`;
  return null;
}

export function validate(fields) {
  const errors = [];
  for (const { check, message } of fields) {
    if (check) errors.push(message);
  }
  return errors.length > 0 ? errors : null;
}

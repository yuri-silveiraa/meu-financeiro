import { z } from 'zod';

/**
 * Converte strings vazias ('', whitespace) ou nulas em undefined antes de validar.
 * Útil para campos numéricos opcionais que podem vir de query strings ou forms vazios.
 */
export const optionalNumber = (schema: z.ZodTypeAny = z.number()) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
      return undefined;
    }
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, schema.optional());

/**
 * Converte strings vazias ('', whitespace), nulas ou undefined em null antes de validar.
 * Útil para foreign keys opcionais (ex: categoria_id, conta_id, cartao_id) em corpos de requisição.
 */
export const nullableNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
    return null;
  }
  const num = Number(val);
  return isNaN(num) ? val : num;
}, z.number().nullable().optional());

/**
 * Converte strings vazias ou nulas em undefined para enums opcionais.
 */
export const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
      return undefined;
    }
    return val;
  }, z.enum(values).optional());

/**
 * Transforma valores booleanos de query string ('true', 'false', '1', '0', boolean)
 * e converte strings vazias para undefined.
 */
export const booleanQueryParam = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
    return undefined;
  }
  if (val === 'true' || val === '1' || val === true) return true;
  if (val === 'false' || val === '0' || val === false) return false;
  return val;
}, z.boolean().optional());

/**
 * Converte strings vazias ou nulas em undefined.
 */
export const optionalString = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return val;
}, z.string().optional());

/**
 * Converte strings vazias em null para campos opcionais que aceitam null no banco de dados.
 */
export const nullableString = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  }
  return val;
}, z.string().nullable().optional());

import { z } from 'zod';
import {
  optionalNumber,
  nullableNumber,
  nullableString,
} from './helpers.js';

export const createMetaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  valor_meta: z.coerce.number().positive('Valor da meta deve ser maior que zero'),
  valor_atual: optionalNumber(z.number().min(0)).default(0),
  prazo: nullableString,
  categoria_id: nullableNumber,
});

export const updateMetaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  valor_meta: z.coerce.number().positive('Valor da meta deve ser maior que zero').optional(),
  valor_atual: optionalNumber(z.number().min(0)),
  prazo: nullableString,
  categoria_id: nullableNumber,
});

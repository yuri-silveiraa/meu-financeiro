import { z } from 'zod';
import {
  optionalNumber,
  nullableString,
  optionalString,
} from './helpers.js';

export const createContaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  banco: nullableString,
  tipo_conta: optionalString.default('corrente'),
  saldo_inicial: optionalNumber().default(0),
});

export const updateContaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  banco: nullableString,
  tipo_conta: optionalString,
  saldo_inicial: optionalNumber(),
});

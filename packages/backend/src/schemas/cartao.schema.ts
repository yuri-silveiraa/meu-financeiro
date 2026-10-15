import { z } from 'zod';
import {
  optionalNumber,
  nullableNumber,
  optionalString,
} from './helpers.js';

export const createCartaoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  bandeira: optionalString.default('outro'),
  limite: z.coerce.number().min(0, 'Limite deve ser no mínimo zero'),
  dia_fechamento: z.coerce.number().int().min(1, 'Dia de fechamento deve ser entre 1 e 31').max(31, 'Dia de fechamento deve ser entre 1 e 31'),
  dia_vencimento: z.coerce.number().int().min(1, 'Dia de vencimento deve ser entre 1 e 31').max(31, 'Dia de vencimento deve ser entre 1 e 31'),
  conta_padrao_id: nullableNumber,
  cor: optionalString.default('#6366f1'),
});

export const updateCartaoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  bandeira: optionalString,
  limite: optionalNumber(z.number().min(0, 'Limite deve ser no mínimo zero')),
  dia_fechamento: optionalNumber(z.number().int().min(1).max(31)),
  dia_vencimento: optionalNumber(z.number().int().min(1).max(31)),
  conta_padrao_id: nullableNumber,
  cor: optionalString,
});

export const pagarFaturaSchema = z.object({
  conta_id: nullableNumber,
  data_pagamento: optionalString,
});

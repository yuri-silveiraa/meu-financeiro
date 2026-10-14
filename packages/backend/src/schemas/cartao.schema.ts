import { z } from 'zod';

export const createCartaoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  bandeira: z.string().trim().optional().default('outro'),
  limite: z.coerce.number().min(0, 'Limite deve ser no mínimo zero'),
  dia_fechamento: z.coerce.number().int().min(1, 'Dia de fechamento deve ser entre 1 e 31').max(31, 'Dia de fechamento deve ser entre 1 e 31'),
  dia_vencimento: z.coerce.number().int().min(1, 'Dia de vencimento deve ser entre 1 e 31').max(31, 'Dia de vencimento deve ser entre 1 e 31'),
  conta_padrao_id: z.coerce.number().nullable().optional(),
  cor: z.string().trim().optional().default('#6366f1'),
});

export const updateCartaoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  bandeira: z.string().trim().optional(),
  limite: z.coerce.number().min(0, 'Limite deve ser no mínimo zero').optional(),
  dia_fechamento: z.coerce.number().int().min(1, 'Dia de fechamento deve ser entre 1 e 31').max(31, 'Dia de fechamento deve ser entre 1 e 31').optional(),
  dia_vencimento: z.coerce.number().int().min(1, 'Dia de vencimento deve ser entre 1 e 31').max(31, 'Dia de vencimento deve ser entre 1 e 31').optional(),
  conta_padrao_id: z.coerce.number().nullable().optional(),
  cor: z.string().trim().optional(),
});

export const pagarFaturaSchema = z.object({
  conta_id: z.coerce.number().nullable().optional(),
  data_pagamento: z.string().trim().optional(),
});

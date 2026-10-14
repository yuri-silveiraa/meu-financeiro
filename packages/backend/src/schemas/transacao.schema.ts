import { z } from 'zod';

export const transacaoQuerySchema = z.object({
  dataInicio: z.string().trim().optional(),
  dataFim: z.string().trim().optional(),
  categoriaId: z.coerce.number().optional(),
  contaId: z.coerce.number().optional(),
  cartaoId: z.coerce.number().optional(),
  faturaMes: z.coerce.number().int().min(1).max(12).optional(),
  faturaAno: z.coerce.number().int().min(2000).max(2100).optional(),
  tipo: z.enum(['receita', 'despesa']).optional(),
  pago: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  limit: z.coerce.number().int().positive().optional().default(500),
});

export const createTransacaoSchema = z.object({
  data: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ter formato AAAA-MM-DD'),
  descricao: z.string().trim().optional(),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  tipo: z.enum(['receita', 'despesa']),
  tipo_pagamento: z.enum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']).optional(),
  categoria_id: z.coerce.number().nullable().optional(),
  conta_id: z.coerce.number().nullable().optional(),
  cartao_id: z.coerce.number().nullable().optional(),
  pago: z.coerce.boolean().optional().default(false),
  gasto_fixo_id: z.coerce.number().nullable().optional(),
  total_parcelas: z.coerce.number().int().positive().optional().default(1),
});

export const updateTransacaoSchema = z.object({
  data: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ter formato AAAA-MM-DD').optional(),
  descricao: z.string().trim().optional(),
  valor: z.coerce.number().positive('Valor deve ser maior que zero').optional(),
  tipo: z.enum(['receita', 'despesa']).optional(),
  tipo_pagamento: z.enum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']).optional(),
  categoria_id: z.coerce.number().nullable().optional(),
  conta_id: z.coerce.number().nullable().optional(),
  cartao_id: z.coerce.number().nullable().optional(),
  pago: z.coerce.boolean().optional(),
  gasto_fixo_id: z.coerce.number().nullable().optional(),
});

import { z } from 'zod';
import {
  optionalNumber,
  nullableNumber,
  optionalEnum,
  booleanQueryParam,
  optionalString,
} from './helpers.js';

export const transacaoQuerySchema = z.object({
  dataInicio: optionalString,
  dataFim: optionalString,
  categoriaId: optionalNumber(),
  contaId: optionalNumber(),
  cartaoId: optionalNumber(),
  faturaMes: optionalNumber(z.number().int().min(1).max(12)),
  faturaAno: optionalNumber(z.number().int().min(2000).max(2100)),
  tipo: optionalEnum(['receita', 'despesa']),
  pago: booleanQueryParam,
  limit: optionalNumber(z.number().int().positive()).default(500),
});

export const createTransacaoSchema = z.object({
  data: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ter formato AAAA-MM-DD'),
  descricao: optionalString,
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  tipo: z.enum(['receita', 'despesa']),
  tipo_pagamento: optionalEnum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
  categoria_id: nullableNumber,
  conta_id: nullableNumber,
  cartao_id: nullableNumber,
  pago: z.coerce.boolean().optional().default(false),
  gasto_fixo_id: nullableNumber,
  total_parcelas: optionalNumber(z.number().int().positive()).default(1),
});

export const updateTransacaoSchema = z.object({
  data: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ter formato AAAA-MM-DD').optional(),
  descricao: optionalString,
  valor: z.coerce.number().positive('Valor deve ser maior que zero').optional(),
  tipo: optionalEnum(['receita', 'despesa']),
  tipo_pagamento: optionalEnum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
  categoria_id: nullableNumber,
  conta_id: nullableNumber,
  cartao_id: nullableNumber,
  pago: z.coerce.boolean().optional(),
  gasto_fixo_id: nullableNumber,
});

export const updateManyPagoSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Pelo menos um ID deve ser fornecido'),
  pago: z.coerce.boolean(),
});

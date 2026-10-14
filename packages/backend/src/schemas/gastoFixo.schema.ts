import { z } from 'zod';

export const createGastoFixoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  dia_vencimento: z.coerce.number().int().min(1).max(31).optional(),
  tipo_pagamento: z.enum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']).optional(),
  categoria_id: z.coerce.number().nullable().optional(),
  conta_id: z.coerce.number().nullable().optional(),
  cartao_id: z.coerce.number().nullable().optional(),
  total_parcelas: z.coerce.number().int().positive().nullable().optional(),
  tipo: z.enum(['receita', 'despesa']).optional().default('despesa'),
});

export const updateGastoFixoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  valor: z.coerce.number().positive('Valor deve ser positivo').optional(),
  dia_vencimento: z.coerce.number().int().min(1).max(31).optional(),
  tipo_pagamento: z.enum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']).optional(),
  categoria_id: z.coerce.number().nullable().optional(),
  conta_id: z.coerce.number().nullable().optional(),
  cartao_id: z.coerce.number().nullable().optional(),
  total_parcelas: z.coerce.number().int().positive().nullable().optional(),
  tipo: z.enum(['receita', 'despesa']).optional(),
});

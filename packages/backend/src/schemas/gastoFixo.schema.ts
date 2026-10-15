import { z } from 'zod';
import {
  optionalNumber,
  nullableNumber,
  optionalEnum,
  optionalString,
} from './helpers.js';

export const createGastoFixoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  dia_vencimento: optionalNumber(z.number().int().min(1).max(31)),
  tipo_pagamento: optionalEnum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
  categoria_id: nullableNumber,
  conta_id: nullableNumber,
  cartao_id: nullableNumber,
  total_parcelas: nullableNumber,
  tipo: optionalEnum(['receita', 'despesa']).default('despesa'),
});

export const updateGastoFixoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  valor: z.coerce.number().positive('Valor deve ser positivo').optional(),
  dia_vencimento: optionalNumber(z.number().int().min(1).max(31)),
  tipo_pagamento: optionalEnum(['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
  categoria_id: nullableNumber,
  conta_id: nullableNumber,
  cartao_id: nullableNumber,
  total_parcelas: nullableNumber,
  tipo: optionalEnum(['receita', 'despesa']),
});

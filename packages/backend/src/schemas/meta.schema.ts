import { z } from 'zod';

export const createMetaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  valor_meta: z.coerce.number().positive('Valor da meta deve ser maior que zero'),
  valor_atual: z.coerce.number().optional().default(0),
  prazo: z.string().trim().nullable().optional(),
  categoria_id: z.coerce.number().nullable().optional(),
});

export const updateMetaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  valor_meta: z.coerce.number().positive('Valor da meta deve ser maior que zero').optional(),
  valor_atual: z.coerce.number().optional(),
  prazo: z.string().trim().nullable().optional(),
  categoria_id: z.coerce.number().nullable().optional(),
});

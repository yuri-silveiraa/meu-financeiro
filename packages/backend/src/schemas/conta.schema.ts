import { z } from 'zod';

export const createContaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  banco: z.string().trim().nullable().optional(),
  tipo_conta: z.string().trim().optional(),
  saldo_inicial: z.coerce.number().optional().default(0),
});

export const updateContaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  banco: z.string().trim().nullable().optional(),
  tipo_conta: z.string().trim().optional(),
  saldo_inicial: z.coerce.number().optional(),
});

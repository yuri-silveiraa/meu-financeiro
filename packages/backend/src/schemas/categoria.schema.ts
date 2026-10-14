import { z } from 'zod';

export const createCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  cor: z.string().trim().optional(),
  icone: z.string().trim().optional(),
});

export const updateCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  cor: z.string().trim().optional(),
  icone: z.string().trim().optional(),
});

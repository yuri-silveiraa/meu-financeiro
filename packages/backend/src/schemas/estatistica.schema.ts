import { z } from 'zod';

export const estatisticasMensaisQuerySchema = z.object({
  mes: z.coerce.number().int().min(1, 'Mês deve ser entre 1 e 12').max(12, 'Mês deve ser entre 1 e 12'),
  ano: z.coerce.number().int().min(2000, 'Ano deve ser >= 2000'),
});

export const cartoesAnualQuerySchema = z.object({
  ano: z.coerce.number().int().min(2000, 'Ano deve ser >= 2000').optional().default(new Date().getFullYear()),
});

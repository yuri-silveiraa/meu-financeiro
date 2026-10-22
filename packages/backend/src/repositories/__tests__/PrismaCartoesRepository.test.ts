import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaCartoesRepository } from '../PrismaCartoesRepository.js';
import { prisma } from '../../config/prisma.js';

vi.mock('../../config/prisma.js', () => ({
  prisma: {
    transacao: {
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    cartao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('PrismaCartoesRepository', () => {
  let repository: PrismaCartoesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaCartoesRepository();
  });

  describe('getLimiteComprometido', () => {
    it('deve desconsiderar gastos fixos (gastoFixoId: null) ao calcular limite comprometido do cartão', async () => {
      vi.mocked(prisma.transacao.aggregate).mockResolvedValue({
        _sum: { valor: 850 as any },
      } as any);

      const comprometido = await repository.getLimiteComprometido(5, 10);

      expect(comprometido).toBe(850);
      expect(prisma.transacao.aggregate).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(prisma.transacao.aggregate).mock.calls[0][0];

      expect(callArgs?.where).toEqual({
        cartaoId: 5,
        userId: 10,
        tipo: 'despesa',
        pago: false,
        gastoFixoId: null,
      });
    });
  });
});

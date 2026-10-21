import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaTransacoesRepository } from '../PrismaTransacoesRepository.js';
import { prisma } from '../../config/prisma.js';

vi.mock('../../config/prisma.js', () => ({
  prisma: {
    transacao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('PrismaTransacoesRepository', () => {
  let repository: PrismaTransacoesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaTransacoesRepository();
  });

  describe('findManyWithFilters', () => {
    it('deve preservar ambos gte e lte no filtro de data ao filtrar por período/mês', async () => {
      vi.mocked(prisma.transacao.findMany).mockResolvedValue([]);

      await repository.findManyWithFilters(
        1,
        {
          dataInicio: '2026-11-01',
          dataFim: '2026-11-30',
        },
        500
      );

      expect(prisma.transacao.findMany).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(prisma.transacao.findMany).mock.calls[0][0];

      expect(callArgs?.where).toBeDefined();
      expect(callArgs?.where?.userId).toBe(1);
      expect(callArgs?.where?.data).toBeDefined();
      expect(callArgs?.where?.data).toEqual({
        gte: new Date('2026-11-01T00:00:00.000Z'),
        lte: new Date('2026-11-30T23:59:59.999Z'),
      });
    });

    it('deve filtrar apenas por gte se apenas dataInicio for fornecida', async () => {
      vi.mocked(prisma.transacao.findMany).mockResolvedValue([]);

      await repository.findManyWithFilters(
        1,
        {
          dataInicio: '2026-11-01',
        },
        500
      );

      const callArgs = vi.mocked(prisma.transacao.findMany).mock.calls[0][0];
      expect(callArgs?.where?.data).toEqual({
        gte: new Date('2026-11-01T00:00:00.000Z'),
      });
    });

    it('deve filtrar apenas por lte se apenas dataFim for fornecida', async () => {
      vi.mocked(prisma.transacao.findMany).mockResolvedValue([]);

      await repository.findManyWithFilters(
        1,
        {
          dataFim: '2026-11-30',
        },
        500
      );

      const callArgs = vi.mocked(prisma.transacao.findMany).mock.calls[0][0];
      expect(callArgs?.where?.data).toEqual({
        lte: new Date('2026-11-30T23:59:59.999Z'),
      });
    });

    it('não deve incluir chave data no where se nenhuma data for fornecida', async () => {
      vi.mocked(prisma.transacao.findMany).mockResolvedValue([]);

      await repository.findManyWithFilters(1, {}, 500);

      const callArgs = vi.mocked(prisma.transacao.findMany).mock.calls[0][0];
      expect(callArgs?.where?.data).toBeUndefined();
    });
  });
});

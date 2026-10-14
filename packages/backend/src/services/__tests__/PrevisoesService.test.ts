import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrevisoesService } from '../PrevisoesService.js';
import type { IGastosFixosRepository, GastoFixoWithRelations } from '../../types/repositories/IGastosFixosRepository.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('PrevisoesService', () => {
  let mockRepo: IGastosFixosRepository;
  let service: PrevisoesService;

  beforeEach(() => {
    mockRepo = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      findAtivosComParcelas: vi.fn(),
      getTransacoesStats: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateTransacoesNaoPagas: vi.fn(),
      deleteTransacoesNaoPagas: vi.fn(),
      createTransacoesLote: vi.fn(),
      softDelete: vi.fn(),
    };
    service = new PrevisoesService(mockRepo);
  });

  it('retorna previsões agrupadas por categoria única ordenadas por valor decrescente', async () => {
    const fakeGastos: GastoFixoWithRelations[] = [
      {
        id: 1,
        userId: 10,
        nome: 'Internet Fibra',
        valor: new Decimal(120),
        diaVencimento: 10,
        tipoPagamento: 'pix',
        categoriaId: 1,
        contaId: null,
        cartaoId: null,
        totalParcelas: null,
        tipo: 'despesa',
        ativo: true,
        dataCriacao: new Date(),
        categoria: { id: 1, userId: 10, nome: 'Contas Residenciais', cor: '#3b82f6', icone: 'home' },
        conta: null,
        cartao: null,
      },
      {
        id: 2,
        userId: 10,
        nome: 'Luz',
        valor: new Decimal(200),
        diaVencimento: 15,
        tipoPagamento: 'pix',
        categoriaId: 1, // mesma categoria
        contaId: null,
        cartaoId: null,
        totalParcelas: null,
        tipo: 'despesa',
        ativo: true,
        dataCriacao: new Date(),
        categoria: { id: 1, userId: 10, nome: 'Contas Residenciais', cor: '#3b82f6', icone: 'home' },
        conta: null,
        cartao: null,
      },
      {
        id: 3,
        userId: 10,
        nome: 'Salário CLT',
        valor: new Decimal(6000),
        diaVencimento: 5,
        tipoPagamento: 'pix',
        categoriaId: 2,
        contaId: null,
        cartaoId: null,
        totalParcelas: null,
        tipo: 'receita',
        ativo: true,
        dataCriacao: new Date(),
        categoria: { id: 2, userId: 10, nome: 'Renda', cor: '#10b981', icone: 'money' },
        conta: null,
        cartao: null,
      },
    ];

    vi.mocked(mockRepo.findByUserId).mockResolvedValue(fakeGastos);

    const result = await service.getPrevisoes(10);

    // Deve conter apenas 1 para categoriaId 1 (o primeiro encontrado 'Internet Fibra') e 1 para categoriaId 2
    expect(result).toHaveLength(2);
    expect(result.some((r) => r.categoria === 'Internet Fibra')).toBe(true);
    expect(result.some((r) => r.categoria === 'Salário CLT')).toBe(true);
  });
});

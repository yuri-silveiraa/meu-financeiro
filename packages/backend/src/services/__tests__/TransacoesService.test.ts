import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransacoesService } from '../TransacoesService.js';
import type { ITransacoesRepository, TransacaoWithRelations } from '../../types/repositories/ITransacoesRepository.js';
import type { ICartoesRepository, CartaoWithConta } from '../../types/repositories/ICartoesRepository.js';
import { AppError } from '../../errors/AppError.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransacoesService', () => {
  let mockRepo: ITransacoesRepository;
  let mockCartoesRepo: ICartoesRepository;
  let service: TransacoesService;

  beforeEach(() => {
    mockRepo = {
      findManyWithFilters: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteByGrupo: vi.fn(),
      deleteFutureByGrupo: vi.fn(),
      togglePago: vi.fn(),
    };
    mockCartoesRepo = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      getLimiteComprometido: vi.fn(),
      getFaturaStats: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFaturasGrouped: vi.fn(),
      findTransacoesFatura: vi.fn(),
      pagarFatura: vi.fn(),
    };
    service = new TransacoesService(mockRepo, mockCartoesRepo);
  });

  it('lista transações com filtros e formata dados normalizados', async () => {
    const fakeTransacao: TransacaoWithRelations = {
      id: 1,
      userId: 10,
      data: new Date('2026-10-15T00:00:00.000Z'),
      descricao: 'Supermercado',
      valor: new Decimal(180.5),
      tipo: 'despesa',
      tipoPagamento: 'debito',
      categoriaId: 1,
      contaId: 2,
      cartaoId: null,
      pago: true,
      gastoFixoId: null,
      parcelaAtual: null,
      totalParcelas: 1,
      faturaMes: null,
      faturaAno: null,
      compraGrupoId: null,
      categoria: {
        id: 1,
        userId: 10,
        nome: 'Alimentação',
        cor: '#10b981',
        icone: 'food',
      },
      conta: {
        id: 2,
        userId: 10,
        nome: 'Nubank',
        banco: 'Nu',
        tipoConta: 'corrente',
        saldoInicial: new Decimal(0),
      },
      cartao: null,
      gastoFixo: null,
    };

    vi.mocked(mockRepo.findManyWithFilters).mockResolvedValue([fakeTransacao]);

    const result = await service.list(10, { tipo: 'despesa' });

    expect(mockRepo.findManyWithFilters).toHaveBeenCalledWith(10, { tipo: 'despesa' }, 500);
    expect(result).toHaveLength(1);
    expect(result[0].categoria_nome).toBe('Alimentação');
    expect(result[0].conta_nome).toBe('Nubank');
    expect(result[0].valor).toBe(180.5);
    expect(result[0].data).toBe('2026-10-15');
  });

  it('cria compra parcelada no cartão de crédito calculando datas e faturas', async () => {
    const fakeCartao: CartaoWithConta = {
      id: 5,
      userId: 10,
      nome: 'Mastercard Black',
      bandeira: 'mastercard',
      limite: new Decimal(10000),
      diaFechamento: 20,
      diaVencimento: 5,
      contaPadraoId: null,
      cor: '#000',
      createdAt: new Date(),
      contaPadrao: null,
    };

    const fakePrimeiraParcela: TransacaoWithRelations = {
      id: 101,
      userId: 10,
      data: new Date('2026-11-05T00:00:00.000Z'),
      descricao: 'Celular (1/3)',
      valor: new Decimal(1000),
      tipo: 'despesa',
      tipoPagamento: 'credito',
      categoriaId: null,
      contaId: null,
      cartaoId: 5,
      pago: false,
      gastoFixoId: null,
      parcelaAtual: 1,
      totalParcelas: 3,
      faturaMes: 11,
      faturaAno: 2026,
      compraGrupoId: 'uuid-123',
      categoria: null,
      conta: null,
      cartao: null,
      gastoFixo: null,
    };

    vi.mocked(mockCartoesRepo.findById).mockResolvedValue(fakeCartao);
    vi.mocked(mockRepo.create).mockResolvedValue(fakePrimeiraParcela);

    const result = await service.create(10, {
      data: '2026-10-25',
      descricao: 'Celular',
      valor: 3000,
      tipo: 'despesa',
      tipo_pagamento: 'credito',
      cartao_id: 5,
      total_parcelas: 3,
    });

    expect(mockRepo.create).toHaveBeenCalledTimes(3);
    expect(result.id).toBe(101);
    expect(result.parcela_atual).toBe(1);
    expect(result.total_parcelas).toBe(3);
  });

  it('alterna o status pago via togglePago', async () => {
    const fakeTransacao: TransacaoWithRelations = {
      id: 7,
      userId: 10,
      data: new Date(),
      descricao: 'Café',
      valor: new Decimal(8),
      tipo: 'despesa',
      tipoPagamento: 'pix',
      categoriaId: null,
      contaId: null,
      cartaoId: null,
      pago: false,
      gastoFixoId: null,
      parcelaAtual: null,
      totalParcelas: 1,
      faturaMes: null,
      faturaAno: null,
      compraGrupoId: null,
      categoria: null,
      conta: null,
      cartao: null,
      gastoFixo: null,
    };

    vi.mocked(mockRepo.findById).mockResolvedValue(fakeTransacao);
    vi.mocked(mockRepo.togglePago).mockResolvedValue(true);

    const result = await service.togglePago(7, 10);

    expect(mockRepo.togglePago).toHaveBeenCalledWith(7, 10, true);
    expect(result).toEqual({ success: true, pago: true });
  });

  it('deleta transações futuras de compra parcelada quando mode=future', async () => {
    const fakeTransacao: TransacaoWithRelations = {
      id: 20,
      userId: 10,
      data: new Date(),
      descricao: 'TV (2/4)',
      valor: new Decimal(500),
      tipo: 'despesa',
      tipoPagamento: 'credito',
      categoriaId: null,
      contaId: null,
      cartaoId: null,
      pago: false,
      gastoFixoId: null,
      parcelaAtual: 2,
      totalParcelas: 4,
      faturaMes: null,
      faturaAno: null,
      compraGrupoId: 'grupo-tv',
      categoria: null,
      conta: null,
      cartao: null,
      gastoFixo: null,
    };

    vi.mocked(mockRepo.findById).mockResolvedValue(fakeTransacao);

    await service.delete(20, 10, 'future');

    expect(mockRepo.deleteFutureByGrupo).toHaveBeenCalledWith('grupo-tv', 2, 10);
  });
});

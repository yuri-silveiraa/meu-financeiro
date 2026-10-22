import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GastosFixosService } from '../GastosFixosService.js';
import type { IGastosFixosRepository, GastoFixoWithRelations } from '../../types/repositories/IGastosFixosRepository.js';
import { AppError } from '../../errors/AppError.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('GastosFixosService', () => {
  let mockRepo: IGastosFixosRepository;
  let service: GastosFixosService;

  beforeEach(() => {
    mockRepo = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      findAtivos: vi.fn().mockResolvedValue([]),
      findAtivosComParcelas: vi.fn().mockResolvedValue([]),
      getTransacoesStats: vi.fn(),
      existeTransacaoNoMes: vi.fn().mockResolvedValue(false),
      deleteTransacoesFuturasNaoPagas: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      updateTransacoesNaoPagas: vi.fn(),
      deleteTransacoesNaoPagas: vi.fn(),
      createTransacoesLote: vi.fn().mockResolvedValue(12),
      removerDuplicatasGastosFixos: vi.fn().mockResolvedValue(0),
      softDelete: vi.fn(),
    };
    service = new GastosFixosService(mockRepo);
  });

  it('cria gasto fixo recorrente gerando 12 transações mensais para planejamento futuro', async () => {
    const fakeCreated: GastoFixoWithRelations = {
      id: 1,
      userId: 10,
      nome: 'Aluguel',
      valor: new Decimal(2500),
      diaVencimento: 10,
      tipoPagamento: 'pix',
      categoriaId: 2,
      contaId: 1,
      cartaoId: null,
      totalParcelas: null,
      tipo: 'despesa',
      ativo: true,
      dataCriacao: new Date(),
      categoria: null,
      conta: null,
      cartao: null,
    };

    vi.mocked(mockRepo.create).mockResolvedValue(fakeCreated);
    vi.mocked(mockRepo.createTransacoesLote).mockResolvedValue(12);

    const result = await service.create(10, {
      nome: 'Aluguel',
      valor: 2500,
      dia_vencimento: 10,
      tipo_pagamento: 'pix',
      categoria_id: 2,
      conta_id: 1,
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        totalParcelas: null,
      })
    );
    expect(mockRepo.createTransacoesLote).toHaveBeenCalledTimes(1);
    const transacoesLote = vi.mocked(mockRepo.createTransacoesLote).mock.calls[0][0];
    expect(transacoesLote).toHaveLength(12);
    expect(transacoesLote[0]).toEqual(
      expect.objectContaining({
        descricao: 'Aluguel',
        valor: 2500,
        pago: false,
        gastoFixoId: 1,
        parcelaAtual: null,
        totalParcelas: 1,
      })
    );
    expect(result.id).toBe(1);
    expect(result.transacoesCriadas).toBe(12);
  });

  it('cria gasto fixo no cartão gerando 12 meses com fatura calculada', async () => {
    const fakeCartao = {
      id: 5,
      userId: 10,
      nome: 'Nubank',
      bandeira: 'mastercard',
      limite: new Decimal(5000),
      diaFechamento: 20,
      diaVencimento: 27,
      contaPadraoId: null,
      cor: '#820ad1',
    };

    const fakeCreated: GastoFixoWithRelations = {
      id: 2,
      userId: 10,
      nome: 'Netflix',
      valor: new Decimal(55.9),
      diaVencimento: 15,
      tipoPagamento: 'credito',
      categoriaId: null,
      contaId: null,
      cartaoId: 5,
      totalParcelas: null,
      tipo: 'despesa',
      ativo: true,
      dataCriacao: new Date(),
      categoria: null,
      conta: null,
      cartao: fakeCartao,
    };

    vi.mocked(mockRepo.create).mockResolvedValue(fakeCreated);
    vi.mocked(mockRepo.createTransacoesLote).mockResolvedValue(12);

    const result = await service.create(10, {
      nome: 'Netflix',
      valor: 55.9,
      dia_vencimento: 15,
      tipo_pagamento: 'credito',
      cartao_id: 5,
    });

    const transacoesLote = vi.mocked(mockRepo.createTransacoesLote).mock.calls[0][0];
    expect(transacoesLote).toHaveLength(12);
    expect(transacoesLote[0]).toEqual(
      expect.objectContaining({
        descricao: 'Netflix',
        valor: 55.9,
        cartaoId: 5,
        tipoPagamento: 'credito',
        totalParcelas: 1,
        parcelaAtual: null,
        faturaMes: expect.any(Number),
        faturaAno: expect.any(Number),
      })
    );
    expect(result.id).toBe(2);
    expect(result.transacoesCriadas).toBe(12);
  });

  it('list remove duplicatas existentes e não recria transações deletadas', async () => {
    vi.mocked(mockRepo.findByUserId).mockResolvedValue([]);

    await service.list(10);

    expect(mockRepo.removerDuplicatasGastosFixos).toHaveBeenCalledWith(10);
    expect(mockRepo.findByUserId).toHaveBeenCalledWith(10);
    expect(mockRepo.createTransacoesLote).not.toHaveBeenCalled();
  });

  it('lança AppError 404 ao tentar atualizar gasto fixo inexistente', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(service.update(999, 10, { nome: 'Novo' })).rejects.toThrow(AppError);
  });

  it('deleta gasto fixo através de soft delete', async () => {
    const fakeGf: GastoFixoWithRelations = {
      id: 1,
      userId: 10,
      nome: 'Academia',
      valor: new Decimal(100),
      diaVencimento: 5,
      tipoPagamento: 'debito',
      categoriaId: null,
      contaId: null,
      cartaoId: null,
      totalParcelas: null,
      tipo: 'despesa',
      ativo: true,
      dataCriacao: new Date(),
      categoria: null,
      conta: null,
      cartao: null,
    };
    vi.mocked(mockRepo.findById).mockResolvedValue(fakeGf);
    vi.mocked(mockRepo.softDelete).mockResolvedValue(undefined as unknown as void);

    await service.delete(1, 10);

    expect(mockRepo.softDelete).toHaveBeenCalledWith(1, 10);
  });
});

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
      findAtivosComParcelas: vi.fn().mockResolvedValue([]),
      getTransacoesStats: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateTransacoesNaoPagas: vi.fn(),
      deleteTransacoesNaoPagas: vi.fn(),
      createTransacoesLote: vi.fn().mockResolvedValue(12),
      softDelete: vi.fn(),
    };
    service = new GastosFixosService(mockRepo);
  });

  it('cria gasto fixo recorrente e gera transações em lote para os meses restantes', async () => {
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

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.createTransacoesLote).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          descricao: 'Aluguel',
          valor: 2500,
          pago: false,
          gastoFixoId: 1,
        }),
      ])
    );
    expect(result.id).toBe(1);
    expect(result.transacoesCriadas).toBe(12);
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

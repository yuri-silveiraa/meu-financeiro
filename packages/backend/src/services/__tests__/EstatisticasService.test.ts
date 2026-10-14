import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EstatisticasService } from '../EstatisticasService.js';
import type { IEstatisticasRepository } from '../../types/repositories/IEstatisticasRepository.js';
import { AppError } from '../../errors/AppError.js';

describe('EstatisticasService', () => {
  let mockRepo: IEstatisticasRepository;
  let service: EstatisticasService;

  beforeEach(() => {
    mockRepo = {
      getReceitasDespesas: vi.fn(),
      getPorCategoria: vi.fn(),
      getPorPagamento: vi.fn(),
      getFaturasMes: vi.fn(),
      getLimitesCartoes: vi.fn(),
      getProjecaoFaturas: vi.fn(),
      getCartoesAnual: vi.fn(),
    };
    service = new EstatisticasService(mockRepo);
  });

  it('calcula estatísticas mensais e consolida saldo e projeções', async () => {
    vi.mocked(mockRepo.getReceitasDespesas).mockResolvedValue({
      receitasTotal: 6000,
      despesasTotal: 4000,
      despesasNaoPagasTotal: 500,
    });
    vi.mocked(mockRepo.getPorCategoria).mockResolvedValue([
      { nome: 'Moradia', cor: '#3b82f6', total: 2000 },
    ]);
    vi.mocked(mockRepo.getPorPagamento).mockResolvedValue([
      { tipo_pagamento: 'pix', total: 2000 },
    ]);
    vi.mocked(mockRepo.getFaturasMes).mockResolvedValue({
      total: 1500,
      totalPago: 1500,
      totalAberto: 0,
      qtd: 2,
      todasPagas: true,
    });
    vi.mocked(mockRepo.getLimitesCartoes).mockResolvedValue([
      { id: 1, nome: 'Nubank', cor: '#8a05be', limite: 5000, comprometido: 1000 },
    ]);
    vi.mocked(mockRepo.getProjecaoFaturas).mockResolvedValue([]);

    const result = await service.getMensais(10, 10, 2026);

    expect(result.receitas).toBe(6000);
    expect(result.despesas).toBe(4000);
    expect(result.saldo).toBe(2000);
    expect(result.saldoProjetado).toBe(1500);
    expect(result.despesasNaoPagas).toBe(500);
    expect(result.limitesCartoes.limiteDisponivel).toBe(4000);
    expect(result.limitesCartoes.percentualUsado).toBe(20);
    expect(result.faturasMes.todasPagas).toBe(true);
  });

  it('lança AppError quando mês ou ano forem inválidos', async () => {
    await expect(service.getMensais(10, 13, 2026)).rejects.toThrow(AppError);
    await expect(service.getMensais(10, 0, 2026)).rejects.toThrow(AppError);
  });
});

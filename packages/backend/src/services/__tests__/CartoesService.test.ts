import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartoesService } from '../CartoesService.js';
import type { ICartoesRepository, CartaoWithConta } from '../../types/repositories/ICartoesRepository.js';
import { AppError } from '../../errors/AppError.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('CartoesService', () => {
  let mockRepo: ICartoesRepository;
  let service: CartoesService;

  beforeEach(() => {
    mockRepo = {
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
    service = new CartoesService(mockRepo);
  });

  it('lista cartões com cálculo de limite comprometido e limite disponível', async () => {
    const fakeCartoes: CartaoWithConta[] = [
      {
        id: 1,
        userId: 10,
        nome: 'Nubank Ultravioleta',
        bandeira: 'mastercard',
        limite: new Decimal(5000),
        diaFechamento: 25,
        diaVencimento: 2,
        contaPadraoId: 1,
        cor: '#8a05be',
        createdAt: new Date(),
        contaPadrao: {
          id: 1,
          userId: 10,
          nome: 'Nu Conta',
          banco: 'Nu',
          tipoConta: 'corrente',
          saldoInicial: new Decimal(100),
        },
      },
    ];

    vi.mocked(mockRepo.findByUserId).mockResolvedValue(fakeCartoes);
    vi.mocked(mockRepo.getLimiteComprometido).mockResolvedValue(1200);
    vi.mocked(mockRepo.getFaturaStats).mockResolvedValue({ total: 450, qtd: 3 });

    const result = await service.list(10);

    expect(result).toHaveLength(1);
    expect(result[0].limite).toBe(5000);
    expect(result[0].limite_comprometido).toBe(1200);
    expect(result[0].limite_disponivel).toBe(3800);
    expect(result[0].fatura_atual_total).toBe(450);
    expect(result[0].fatura_atual_qtd).toBe(3);
    expect(result[0].conta_padrao_nome).toBe('Nu Conta');
  });

  it('lança AppError 404 ao buscar cartão inexistente por id', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(service.findById(999, 10)).rejects.toThrow(AppError);
  });

  it('paga fatura com sucesso debitando na conta padrão', async () => {
    const fakeCartao: CartaoWithConta = {
      id: 1,
      userId: 10,
      nome: 'Nubank',
      bandeira: 'mastercard',
      limite: new Decimal(5000),
      diaFechamento: 25,
      diaVencimento: 2,
      contaPadraoId: 5,
      cor: '#8a05be',
      createdAt: new Date(),
      contaPadrao: null,
    };

    vi.mocked(mockRepo.findById).mockResolvedValue(fakeCartao);
    vi.mocked(mockRepo.pagarFatura).mockResolvedValue(4);

    const result = await service.pagarFatura(1, 10, 2026, 10, {});

    expect(mockRepo.pagarFatura).toHaveBeenCalledWith(1, 10, 2026, 10, 5);
    expect(result.success).toBe(true);
    expect(result.transacoes_pagas).toBe(4);
  });
});

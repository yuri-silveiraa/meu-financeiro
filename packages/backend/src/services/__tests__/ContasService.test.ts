import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContasService } from '../ContasService.js';
import type { IContasRepository } from '../../types/repositories/IContasRepository.js';
import { AppError } from '../../errors/AppError.js';
import { Decimal } from '@prisma/client/runtime/library';
import type { Conta } from '@prisma/client';

describe('ContasService', () => {
  let mockRepo: IContasRepository;
  let service: ContasService;

  beforeEach(() => {
    mockRepo = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new ContasService(mockRepo);
  });

  it('lista as contas do usuário e normaliza campos e valores numéricos', async () => {
    const fakeContas: Conta[] = [
      {
        id: 1,
        userId: 10,
        nome: 'Nubank',
        banco: 'Nu Pagamentos',
        tipoConta: 'corrente',
        saldoInicial: new Decimal(1500.5),
      },
    ];
    vi.mocked(mockRepo.findByUserId).mockResolvedValue(fakeContas);

    const result = await service.list(10);

    expect(mockRepo.findByUserId).toHaveBeenCalledWith(10);
    expect(result).toEqual([
      {
        id: 1,
        user_id: 10,
        nome: 'Nubank',
        banco: 'Nu Pagamentos',
        tipo_conta: 'corrente',
        saldo_inicial: 1500.5,
      },
    ]);
  });

  it('cria uma nova conta', async () => {
    const created: Conta = {
      id: 2,
      userId: 10,
      nome: 'Itaú',
      banco: 'Itaú Unibanco',
      tipoConta: 'poupanca',
      saldoInicial: new Decimal(200),
    };
    vi.mocked(mockRepo.create).mockResolvedValue(created);

    const result = await service.create(10, {
      nome: 'Itaú',
      banco: 'Itaú Unibanco',
      tipo_conta: 'poupanca',
      saldo_inicial: 200,
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: 10,
      nome: 'Itaú',
      banco: 'Itaú Unibanco',
      tipoConta: 'poupanca',
      saldoInicial: 200,
    });
    expect(result.id).toBe(2);
    expect(result.saldo_inicial).toBe(200);
  });

  it('lança AppError 404 ao tentar atualizar conta inexistente', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(service.update(999, 10, { nome: 'Nova Conta' })).rejects.toThrow(AppError);
  });

  it('lança AppError 404 ao tentar deletar conta inexistente', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(service.delete(999, 10)).rejects.toThrow(AppError);
  });

  it('deleta com sucesso quando a conta existe', async () => {
    const existing: Conta = {
      id: 3,
      userId: 10,
      nome: 'Bradesco',
      banco: null,
      tipoConta: 'corrente',
      saldoInicial: new Decimal(0),
    };
    vi.mocked(mockRepo.findById).mockResolvedValue(existing);
    vi.mocked(mockRepo.delete).mockResolvedValue(undefined as unknown as void);

    await service.delete(3, 10);

    expect(mockRepo.findById).toHaveBeenCalledWith(3, 10);
    expect(mockRepo.delete).toHaveBeenCalledWith(3, 10);
  });
});

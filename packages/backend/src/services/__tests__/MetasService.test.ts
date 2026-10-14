import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetasService } from '../MetasService.js';
import type { IMetasRepository, MetaWithCategoria } from '../../types/repositories/IMetasRepository.js';
import { AppError } from '../../errors/AppError.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('MetasService', () => {
  let mockRepo: IMetasRepository;
  let service: MetasService;

  beforeEach(() => {
    mockRepo = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new MetasService(mockRepo);
  });

  it('lista as metas do usuário com categoria_nome achatado e valores normalizados', async () => {
    const fakeMetas: MetaWithCategoria[] = [
      {
        id: 1,
        userId: 10,
        nome: 'Reserva de Emergência',
        valorMeta: new Decimal(10000),
        valorAtual: new Decimal(2500),
        prazo: new Date('2026-12-31T00:00:00.000Z'),
        categoriaId: 4,
        categoria: {
          id: 4,
          userId: 10,
          nome: 'Investimentos',
          cor: '#10b981',
          icone: 'bank',
        },
      },
    ];
    vi.mocked(mockRepo.findByUserId).mockResolvedValue(fakeMetas);

    const result = await service.list(10);

    expect(mockRepo.findByUserId).toHaveBeenCalledWith(10);
    expect(result).toEqual([
      {
        id: 1,
        user_id: 10,
        nome: 'Reserva de Emergência',
        valor_meta: 10000,
        valor_atual: 2500,
        prazo: '2026-12-31',
        categoria_id: 4,
        categoria_nome: 'Investimentos',
      },
    ]);
  });

  it('cria uma nova meta com prazo e categoria opcionais', async () => {
    const created: MetaWithCategoria = {
      id: 2,
      userId: 10,
      nome: 'Viagem Japão',
      valorMeta: new Decimal(15000),
      valorAtual: new Decimal(0),
      prazo: null,
      categoriaId: null,
      categoria: null,
    };
    vi.mocked(mockRepo.create).mockResolvedValue(created);

    const result = await service.create(10, {
      nome: 'Viagem Japão',
      valor_meta: 15000,
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: 10,
      nome: 'Viagem Japão',
      valorMeta: 15000,
      valorAtual: 0,
      prazo: null,
      categoriaId: null,
    });
    expect(result.id).toBe(2);
    expect(result.valor_meta).toBe(15000);
    expect(result.categoria_nome).toBeNull();
  });

  it('lança AppError 404 ao tentar atualizar meta inexistente', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(service.update(999, 10, { nome: 'Nova Meta' })).rejects.toThrow(AppError);
  });

  it('deleta meta com sucesso', async () => {
    const existing: MetaWithCategoria = {
      id: 1,
      userId: 10,
      nome: 'Carro',
      valorMeta: new Decimal(50000),
      valorAtual: new Decimal(0),
      prazo: null,
      categoriaId: null,
      categoria: null,
    };
    vi.mocked(mockRepo.findById).mockResolvedValue(existing);
    vi.mocked(mockRepo.delete).mockResolvedValue(undefined as unknown as void);

    await service.delete(1, 10);

    expect(mockRepo.delete).toHaveBeenCalledWith(1, 10);
  });
});

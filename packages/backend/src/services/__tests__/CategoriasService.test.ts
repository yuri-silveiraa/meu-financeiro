import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriasService } from '../CategoriasService.js';
import type { ICategoriasRepository } from '../../types/repositories/ICategoriasRepository.js';
import { AppError } from '../../errors/AppError.js';
import type { Categoria } from '@prisma/client';

describe('CategoriasService', () => {
  let mockRepo: ICategoriasRepository;
  let service: CategoriasService;

  beforeEach(() => {
    mockRepo = {
      findByUserId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new CategoriasService(mockRepo);
  });

  it('lista as categorias do usuário e retorna formato DTO normalizado', async () => {
    const fakeCategorias: Categoria[] = [
      { id: 1, userId: 10, nome: 'Alimentação', cor: '#ff0000', icone: 'food' },
      { id: 2, userId: 10, nome: 'Lazer', cor: null, icone: null },
    ];
    vi.mocked(mockRepo.findByUserId).mockResolvedValue(fakeCategorias);

    const result = await service.list(10);

    expect(mockRepo.findByUserId).toHaveBeenCalledWith(10);
    expect(result).toEqual([
      { id: 1, user_id: 10, nome: 'Alimentação', cor: '#ff0000', icone: 'food' },
      { id: 2, user_id: 10, nome: 'Lazer', cor: '#6366f1', icone: 'folder' },
    ]);
  });

  it('cria uma nova categoria com valores padrão para cor e ícone', async () => {
    const created: Categoria = { id: 3, userId: 10, nome: 'Transporte', cor: '#6366f1', icone: 'folder' };
    vi.mocked(mockRepo.create).mockResolvedValue(created);

    const result = await service.create(10, { nome: 'Transporte' });

    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: 10,
      nome: 'Transporte',
      cor: '#6366f1',
      icone: 'folder',
    });
    expect(result.id).toBe(3);
    expect(result.user_id).toBe(10);
  });

  it('lança AppError 404 ao tentar atualizar categoria inexistente', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(service.update(999, 10, { nome: 'Inexistente' })).rejects.toThrow(AppError);
    await expect(service.update(999, 10, { nome: 'Inexistente' })).rejects.toMatchObject({
      statusCode: 404,
      message: 'Categoria não encontrada',
    });
  });

  it('lança AppError 404 ao tentar deletar categoria inexistente', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(service.delete(999, 10)).rejects.toThrow(AppError);
  });

  it('deleta com sucesso quando categoria existe', async () => {
    const existing: Categoria = { id: 5, userId: 10, nome: 'Viagem', cor: '#10b981', icone: 'plane' };
    vi.mocked(mockRepo.findById).mockResolvedValue(existing);
    vi.mocked(mockRepo.delete).mockResolvedValue(undefined as unknown as void);

    await service.delete(5, 10);

    expect(mockRepo.findById).toHaveBeenCalledWith(5, 10);
    expect(mockRepo.delete).toHaveBeenCalledWith(5, 10);
  });
});

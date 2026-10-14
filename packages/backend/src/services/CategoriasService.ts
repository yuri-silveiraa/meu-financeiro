import type { ICategoriasRepository } from '../types/repositories/ICategoriasRepository.js';
import type { ICategoriasService } from '../types/services/ICategoriasService.js';
import type {
  CreateCategoriaDTO,
  UpdateCategoriaDTO,
  CategoriaResponseDTO,
} from '../types/dtos/categoria.dto.js';
import { CategoriaMapper } from '../mappers/CategoriaMapper.js';
import { AppError } from '../errors/AppError.js';

export class CategoriasService implements ICategoriasService {
  constructor(private readonly repo: ICategoriasRepository) {}

  async list(userId: number): Promise<CategoriaResponseDTO[]> {
    const categories = await this.repo.findByUserId(userId);
    return CategoriaMapper.toDTOList(categories);
  }

  async create(userId: number, data: CreateCategoriaDTO): Promise<CategoriaResponseDTO> {
    const created = await this.repo.create({
      userId,
      nome: data.nome.trim(),
      cor: data.cor?.trim() || '#6366f1',
      icone: data.icone?.trim() || 'folder',
    });
    return CategoriaMapper.toDTO(created);
  }

  async update(id: number, userId: number, data: UpdateCategoriaDTO): Promise<CategoriaResponseDTO> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Categoria não encontrada', 404);
    }

    const updated = await this.repo.update(id, userId, {
      ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
      ...(data.cor !== undefined ? { cor: data.cor.trim() } : {}),
      ...(data.icone !== undefined ? { icone: data.icone.trim() } : {}),
    });

    return CategoriaMapper.toDTO(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Categoria não encontrada', 404);
    }
    await this.repo.delete(id, userId);
  }
}

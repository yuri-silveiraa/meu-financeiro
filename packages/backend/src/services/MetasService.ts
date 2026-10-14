import type { IMetasRepository } from '../types/repositories/IMetasRepository.js';
import type { IMetasService } from '../types/services/IMetasService.js';
import type {
  CreateMetaDTO,
  UpdateMetaDTO,
  MetaResponseDTO,
} from '../types/dtos/meta.dto.js';
import { MetaMapper } from '../mappers/MetaMapper.js';
import { AppError } from '../errors/AppError.js';

export class MetasService implements IMetasService {
  constructor(private readonly repo: IMetasRepository) {}

  async list(userId: number): Promise<MetaResponseDTO[]> {
    const metas = await this.repo.findByUserId(userId);
    return MetaMapper.toDTOList(metas);
  }

  async create(userId: number, data: CreateMetaDTO): Promise<MetaResponseDTO> {
    const prazoDate = data.prazo ? new Date(data.prazo) : null;
    const created = await this.repo.create({
      userId,
      nome: data.nome.trim(),
      valorMeta: data.valor_meta,
      valorAtual: data.valor_atual ?? 0,
      prazo: prazoDate,
      categoriaId: data.categoria_id ?? null,
    });
    return MetaMapper.toDTO(created);
  }

  async update(id: number, userId: number, data: UpdateMetaDTO): Promise<MetaResponseDTO> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Meta não encontrada', 404);
    }

    const prazoDate = data.prazo !== undefined ? (data.prazo ? new Date(data.prazo) : null) : undefined;

    const updated = await this.repo.update(id, userId, {
      ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
      ...(data.valor_meta !== undefined ? { valorMeta: data.valor_meta } : {}),
      ...(data.valor_atual !== undefined ? { valorAtual: data.valor_atual } : {}),
      ...(prazoDate !== undefined ? { prazo: prazoDate } : {}),
      ...(data.categoria_id !== undefined ? { categoriaId: data.categoria_id } : {}),
    });

    return MetaMapper.toDTO(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Meta não encontrada', 404);
    }
    await this.repo.delete(id, userId);
  }
}

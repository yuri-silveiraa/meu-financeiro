import type { IContasRepository } from '../types/repositories/IContasRepository.js';
import type { IContasService } from '../types/services/IContasService.js';
import type {
  CreateContaDTO,
  UpdateContaDTO,
  ContaResponseDTO,
} from '../types/dtos/conta.dto.js';
import { ContaMapper } from '../mappers/ContaMapper.js';
import { AppError } from '../errors/AppError.js';

export class ContasService implements IContasService {
  constructor(private readonly repo: IContasRepository) {}

  async list(userId: number): Promise<ContaResponseDTO[]> {
    const contas = await this.repo.findByUserId(userId);
    return ContaMapper.toDTOList(contas);
  }

  async create(userId: number, data: CreateContaDTO): Promise<ContaResponseDTO> {
    const created = await this.repo.create({
      userId,
      nome: data.nome.trim(),
      banco: data.banco?.trim() || null,
      tipoConta: data.tipo_conta?.trim() || 'corrente',
      saldoInicial: data.saldo_inicial ?? 0,
    });
    return ContaMapper.toDTO(created);
  }

  async update(id: number, userId: number, data: UpdateContaDTO): Promise<ContaResponseDTO> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Conta não encontrada', 404);
    }

    const updated = await this.repo.update(id, userId, {
      ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
      ...(data.banco !== undefined ? { banco: data.banco?.trim() || null } : {}),
      ...(data.tipo_conta !== undefined ? { tipoConta: data.tipo_conta.trim() } : {}),
      ...(data.saldo_inicial !== undefined ? { saldoInicial: data.saldo_inicial } : {}),
    });

    return ContaMapper.toDTO(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Conta não encontrada', 404);
    }
    await this.repo.delete(id, userId);
  }
}

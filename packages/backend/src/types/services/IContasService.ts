import type {
  CreateContaDTO,
  UpdateContaDTO,
  ContaResponseDTO,
} from '../dtos/conta.dto.js';

export interface IContasService {
  list(userId: number): Promise<ContaResponseDTO[]>;
  create(userId: number, data: CreateContaDTO): Promise<ContaResponseDTO>;
  update(id: number, userId: number, data: UpdateContaDTO): Promise<ContaResponseDTO>;
  delete(id: number, userId: number): Promise<void>;
}

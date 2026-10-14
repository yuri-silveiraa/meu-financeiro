import type {
  CreateMetaDTO,
  UpdateMetaDTO,
  MetaResponseDTO,
} from '../dtos/meta.dto.js';

export interface IMetasService {
  list(userId: number): Promise<MetaResponseDTO[]>;
  create(userId: number, data: CreateMetaDTO): Promise<MetaResponseDTO>;
  update(id: number, userId: number, data: UpdateMetaDTO): Promise<MetaResponseDTO>;
  delete(id: number, userId: number): Promise<void>;
}

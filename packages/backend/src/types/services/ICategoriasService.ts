import type {
  CreateCategoriaDTO,
  UpdateCategoriaDTO,
  CategoriaResponseDTO,
} from '../dtos/categoria.dto.js';

export interface ICategoriasService {
  list(userId: number): Promise<CategoriaResponseDTO[]>;
  create(userId: number, data: CreateCategoriaDTO): Promise<CategoriaResponseDTO>;
  update(id: number, userId: number, data: UpdateCategoriaDTO): Promise<CategoriaResponseDTO>;
  delete(id: number, userId: number): Promise<void>;
}

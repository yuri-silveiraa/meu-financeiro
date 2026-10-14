import type { Categoria } from '@prisma/client';
import type { CategoriaResponseDTO } from '../types/dtos/categoria.dto.js';

export class CategoriaMapper {
  static toDTO(categoria: Categoria): CategoriaResponseDTO {
    return {
      id: categoria.id,
      user_id: categoria.userId,
      nome: categoria.nome,
      cor: categoria.cor ?? '#6366f1',
      icone: categoria.icone ?? 'folder',
    };
  }

  static toDTOList(categorias: Categoria[]): CategoriaResponseDTO[] {
    return categorias.map(CategoriaMapper.toDTO);
  }
}

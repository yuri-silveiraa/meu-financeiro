import type { MetaWithCategoria } from '../types/repositories/IMetasRepository.js';
import type { MetaResponseDTO } from '../types/dtos/meta.dto.js';

export class MetaMapper {
  static toDTO(meta: MetaWithCategoria): MetaResponseDTO {
    return {
      id: meta.id,
      user_id: meta.userId,
      nome: meta.nome,
      valor_meta: Number(meta.valorMeta),
      valor_atual: meta.valorAtual ? Number(meta.valorAtual) : 0,
      prazo: meta.prazo ? meta.prazo.toISOString().split('T')[0] : null,
      categoria_id: meta.categoriaId ?? null,
      categoria_nome: meta.categoria?.nome ?? null,
    };
  }

  static toDTOList(metas: MetaWithCategoria[]): MetaResponseDTO[] {
    return metas.map(MetaMapper.toDTO);
  }
}

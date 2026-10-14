import type { IGastosFixosRepository } from '../types/repositories/IGastosFixosRepository.js';
import type { IPrevisoesService } from '../types/services/IPrevisoesService.js';
import type { PrevisaoResponseDTO } from '../types/dtos/estatistica.dto.js';

export class PrevisoesService implements IPrevisoesService {
  constructor(private readonly gastosFixosRepo: IGastosFixosRepository) {}

  async getPrevisoes(userId: number): Promise<PrevisaoResponseDTO[]> {
    const list = await this.gastosFixosRepo.findByUserId(userId);

    const seenCategorias = new Set<number | string>();
    const filtered: PrevisaoResponseDTO[] = [];

    for (const gf of list) {
      const catKey = gf.categoriaId !== null ? gf.categoriaId : `single-${gf.id}`;
      if (!seenCategorias.has(catKey)) {
        seenCategorias.add(catKey);
        filtered.push({
          categoria: gf.nome,
          cor: gf.categoria?.cor ?? null,
          tipo: gf.tipo || 'despesa',
          media_mensal: Number(gf.valor),
        });
      }
    }

    return filtered.sort((a, b) => {
      if (a.tipo !== b.tipo) {
        return a.tipo.localeCompare(b.tipo);
      }
      return b.media_mensal - a.media_mensal;
    });
  }
}

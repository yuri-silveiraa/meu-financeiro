import type { PrevisaoResponseDTO } from '../dtos/estatistica.dto.js';

export interface IPrevisoesService {
  getPrevisoes(userId: number): Promise<PrevisaoResponseDTO[]>;
}

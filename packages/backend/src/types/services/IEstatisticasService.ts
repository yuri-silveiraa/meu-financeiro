import type {
  EstatisticasMensaisResponseDTO,
  CartoesAnualResponseDTO,
} from '../dtos/estatistica.dto.js';

export interface IEstatisticasService {
  getMensais(userId: number, mes: number, ano: number): Promise<EstatisticasMensaisResponseDTO>;
  getCartoesAnual(userId: number, ano: number): Promise<CartoesAnualResponseDTO>;
}

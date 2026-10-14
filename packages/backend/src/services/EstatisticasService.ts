import type { IEstatisticasRepository } from '../types/repositories/IEstatisticasRepository.js';
import type { ICartoesRepository } from '../types/repositories/ICartoesRepository.js';
import type { IEstatisticasService } from '../types/services/IEstatisticasService.js';
import type {
  EstatisticasMensaisResponseDTO,
  CartoesAnualResponseDTO,
} from '../types/dtos/estatistica.dto.js';
import { EstatisticaMapper } from '../mappers/EstatisticaMapper.js';
import { AppError } from '../errors/AppError.js';

export class EstatisticasService implements IEstatisticasService {
  constructor(
    private readonly repo: IEstatisticasRepository,
    private readonly cartoesRepo?: ICartoesRepository
  ) {}

  async getMensais(userId: number, mes: number, ano: number): Promise<EstatisticasMensaisResponseDTO> {
    if (!mes || !ano || mes < 1 || mes > 12 || ano < 2000) {
      throw new AppError('Mês e ano são obrigatórios (mês 1-12, ano >= 2000)', 400);
    }

    const startDate = new Date(Date.UTC(ano, mes - 1, 1));
    const lastDay = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    const endDate = new Date(Date.UTC(ano, mes - 1, lastDay, 23, 59, 59, 999));

    const [summary, porCategoria, porPagamento, faturasMes, cartoesLimites, projecaoFaturasRows] =
      await Promise.all([
        this.repo.getReceitasDespesas(userId, startDate, endDate, ano, mes),
        this.repo.getPorCategoria(userId, startDate, endDate, ano, mes),
        this.repo.getPorPagamento(userId, startDate, endDate, ano, mes),
        this.repo.getFaturasMes(userId, ano, mes),
        this.repo.getLimitesCartoes(userId),
        this.repo.getProjecaoFaturas(userId),
      ]);

    return EstatisticaMapper.toMensaisDTO({
      summary,
      porCategoria,
      porPagamento,
      faturasMes,
      cartoesLimites,
      projecaoFaturasRows,
    });
  }

  async getCartoesAnual(userId: number, ano: number): Promise<CartoesAnualResponseDTO> {
    const anoNum = ano || new Date().getFullYear();
    const [rows, cartoes] = await Promise.all([
      this.repo.getCartoesAnual(userId, anoNum),
      this.cartoesRepo ? this.cartoesRepo.findByUserId(userId) : [],
    ]);

    const mappedCartoes = cartoes.map((c) => ({
      id: c.id,
      nome: c.nome,
      cor: c.cor,
    }));

    return EstatisticaMapper.toCartoesAnualDTO(anoNum, rows, mappedCartoes);
  }
}

import type { Request, Response } from 'express';
import type { IEstatisticasService } from '../types/services/IEstatisticasService.js';
import type {
  EstatisticasMensaisResponseDTO,
  CartoesAnualResponseDTO,
} from '../types/dtos/estatistica.dto.js';

export class EstatisticasController {
  constructor(private readonly service: IEstatisticasService) {}

  getMensais = async (req: Request, res: Response): Promise<Response<EstatisticasMensaisResponseDTO>> => {
    const mes = Number(req.query.mes);
    const ano = Number(req.query.ano);
    const stats = await this.service.getMensais(req.userId!, mes, ano);
    return res.json(stats);
  };

  getCartoesAnual = async (req: Request, res: Response): Promise<Response<CartoesAnualResponseDTO>> => {
    const ano = Number(req.query.ano);
    const stats = await this.service.getCartoesAnual(req.userId!, ano);
    return res.json(stats);
  };
}

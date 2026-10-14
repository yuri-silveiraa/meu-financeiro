import type { Request, Response } from 'express';
import type { IPrevisoesService } from '../types/services/IPrevisoesService.js';
import type { PrevisaoResponseDTO } from '../types/dtos/estatistica.dto.js';

export class PrevisoesController {
  constructor(private readonly service: IPrevisoesService) {}

  getPrevisoes = async (req: Request, res: Response): Promise<Response<PrevisaoResponseDTO[]>> => {
    const previsoes = await this.service.getPrevisoes(req.userId!);
    return res.json(previsoes);
  };
}

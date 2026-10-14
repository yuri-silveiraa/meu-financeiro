import type { Request, Response } from 'express';
import type { IGastosFixosService } from '../types/services/IGastosFixosService.js';
import type { GastoFixoResponseDTO } from '../types/dtos/gastoFixo.dto.js';

export class GastosFixosController {
  constructor(private readonly service: IGastosFixosService) {}

  list = async (req: Request, res: Response): Promise<Response<GastoFixoResponseDTO[]>> => {
    const list = await this.service.list(req.userId!);
    return res.json(list);
  };

  findById = async (req: Request, res: Response): Promise<Response<GastoFixoResponseDTO>> => {
    const id = Number(req.params.id);
    const gf = await this.service.findById(id, req.userId!);
    return res.json(gf);
  };

  create = async (req: Request, res: Response): Promise<Response<any>> => {
    const created = await this.service.create(req.userId!, req.body);
    return res.status(201).json(created);
  };

  update = async (req: Request, res: Response): Promise<Response<GastoFixoResponseDTO>> => {
    const id = Number(req.params.id);
    const updated = await this.service.update(id, req.userId!, req.body);
    return res.json(updated);
  };

  delete = async (req: Request, res: Response): Promise<Response<{ success: boolean }>> => {
    const id = Number(req.params.id);
    await this.service.delete(id, req.userId!);
    return res.json({ success: true });
  };
}

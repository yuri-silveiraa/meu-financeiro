import type { Request, Response } from 'express';
import type { IMetasService } from '../types/services/IMetasService.js';
import type { MetaResponseDTO } from '../types/dtos/meta.dto.js';

export class MetasController {
  constructor(private readonly service: IMetasService) {}

  list = async (req: Request, res: Response): Promise<Response<MetaResponseDTO[]>> => {
    const metas = await this.service.list(req.userId!);
    return res.json(metas);
  };

  create = async (req: Request, res: Response): Promise<Response<MetaResponseDTO>> => {
    const meta = await this.service.create(req.userId!, req.body);
    return res.status(201).json(meta);
  };

  update = async (req: Request, res: Response): Promise<Response<MetaResponseDTO>> => {
    const id = Number(req.params.id);
    const meta = await this.service.update(id, req.userId!, req.body);
    return res.json(meta);
  };

  delete = async (req: Request, res: Response): Promise<Response<{ success: boolean }>> => {
    const id = Number(req.params.id);
    await this.service.delete(id, req.userId!);
    return res.json({ success: true });
  };
}

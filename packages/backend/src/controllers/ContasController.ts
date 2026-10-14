import type { Request, Response } from 'express';
import type { IContasService } from '../types/services/IContasService.js';
import type { ContaResponseDTO } from '../types/dtos/conta.dto.js';

export class ContasController {
  constructor(private readonly service: IContasService) {}

  list = async (req: Request, res: Response): Promise<Response<ContaResponseDTO[]>> => {
    const contas = await this.service.list(req.userId!);
    return res.json(contas);
  };

  create = async (req: Request, res: Response): Promise<Response<ContaResponseDTO>> => {
    const conta = await this.service.create(req.userId!, req.body);
    return res.status(201).json(conta);
  };

  update = async (req: Request, res: Response): Promise<Response<ContaResponseDTO>> => {
    const id = Number(req.params.id);
    const conta = await this.service.update(id, req.userId!, req.body);
    return res.json(conta);
  };

  delete = async (req: Request, res: Response): Promise<Response<{ success: boolean }>> => {
    const id = Number(req.params.id);
    await this.service.delete(id, req.userId!);
    return res.json({ success: true });
  };
}

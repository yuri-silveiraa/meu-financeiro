import type { Request, Response } from 'express';
import type { ICategoriasService } from '../types/services/ICategoriasService.js';
import type { CategoriaResponseDTO } from '../types/dtos/categoria.dto.js';

export class CategoriasController {
  constructor(private readonly service: ICategoriasService) {}

  list = async (req: Request, res: Response): Promise<Response<CategoriaResponseDTO[]>> => {
    const categories = await this.service.list(req.userId!);
    return res.json(categories);
  };

  create = async (req: Request, res: Response): Promise<Response<CategoriaResponseDTO>> => {
    const category = await this.service.create(req.userId!, req.body);
    return res.status(201).json(category);
  };

  update = async (req: Request, res: Response): Promise<Response<CategoriaResponseDTO>> => {
    const id = Number(req.params.id);
    const category = await this.service.update(id, req.userId!, req.body);
    return res.json(category);
  };

  delete = async (req: Request, res: Response): Promise<Response<{ success: boolean }>> => {
    const id = Number(req.params.id);
    await this.service.delete(id, req.userId!);
    return res.json({ success: true });
  };
}

import type { Request, Response } from 'express';
import type { ITransacoesService } from '../types/services/ITransacoesService.js';
import type { TransacaoResponseDTO } from '../types/dtos/transacao.dto.js';

export class TransacoesController {
  constructor(private readonly service: ITransacoesService) {}

  list = async (req: Request, res: Response): Promise<Response<TransacaoResponseDTO[]>> => {
    const filters = req.query as any;
    const transacoes = await this.service.list(req.userId!, filters);
    return res.json(transacoes);
  };

  findById = async (req: Request, res: Response): Promise<Response<TransacaoResponseDTO>> => {
    const id = Number(req.params.id);
    const transacao = await this.service.findById(id, req.userId!);
    return res.json(transacao);
  };

  create = async (req: Request, res: Response): Promise<Response<TransacaoResponseDTO>> => {
    const transacao = await this.service.create(req.userId!, req.body);
    return res.status(201).json(transacao);
  };

  update = async (req: Request, res: Response): Promise<Response<TransacaoResponseDTO>> => {
    const id = Number(req.params.id);
    const transacao = await this.service.update(id, req.userId!, req.body);
    return res.json(transacao);
  };

  delete = async (req: Request, res: Response): Promise<Response<{ success: boolean }>> => {
    const id = Number(req.params.id);
    const mode = (req.query.mode as 'single' | 'future' | 'all') || 'single';
    await this.service.delete(id, req.userId!, mode);
    return res.json({ success: true });
  };

  togglePago = async (req: Request, res: Response): Promise<Response<{ success: boolean; pago: boolean }>> => {
    const id = Number(req.params.id);
    const resultado = await this.service.togglePago(id, req.userId!);
    return res.json(resultado);
  };

  updateManyPago = async (req: Request, res: Response): Promise<Response<{ success: boolean; count: number }>> => {
    const { ids, pago } = req.body;
    const resultado = await this.service.updateManyPago(ids, req.userId!, pago);
    return res.json(resultado);
  };
}

import type { Request, Response } from 'express';
import type { ICartoesService } from '../types/services/ICartoesService.js';
import type {
  CartaoResponseDTO,
  FaturaResumoDTO,
  FaturaDetalhadaDTO,
} from '../types/dtos/cartao.dto.js';

export class CartoesController {
  constructor(private readonly service: ICartoesService) {}

  list = async (req: Request, res: Response): Promise<Response<CartaoResponseDTO[]>> => {
    const cartoes = await this.service.list(req.userId!);
    return res.json(cartoes);
  };

  findById = async (req: Request, res: Response): Promise<Response<CartaoResponseDTO>> => {
    const id = Number(req.params.id);
    const cartao = await this.service.findById(id, req.userId!);
    return res.json(cartao);
  };

  create = async (req: Request, res: Response): Promise<Response<CartaoResponseDTO>> => {
    const cartao = await this.service.create(req.userId!, req.body);
    return res.status(201).json(cartao);
  };

  update = async (req: Request, res: Response): Promise<Response<CartaoResponseDTO>> => {
    const id = Number(req.params.id);
    const cartao = await this.service.update(id, req.userId!, req.body);
    return res.json(cartao);
  };

  delete = async (req: Request, res: Response): Promise<Response<{ success: boolean }>> => {
    const id = Number(req.params.id);
    await this.service.delete(id, req.userId!);
    return res.json({ success: true });
  };

  listFaturas = async (req: Request, res: Response): Promise<Response<FaturaResumoDTO[]>> => {
    const id = Number(req.params.id);
    const faturas = await this.service.listFaturas(id, req.userId!);
    return res.json(faturas);
  };

  getFaturaDetalhada = async (req: Request, res: Response): Promise<Response<FaturaDetalhadaDTO>> => {
    const id = Number(req.params.id);
    const ano = Number(req.params.ano);
    const mes = Number(req.params.mes);
    const fatura = await this.service.getFaturaDetalhada(id, req.userId!, ano, mes);
    return res.json(fatura);
  };

  pagarFatura = async (req: Request, res: Response): Promise<Response<any>> => {
    const id = Number(req.params.id);
    const ano = Number(req.params.ano);
    const mes = Number(req.params.mes);
    const resultado = await this.service.pagarFatura(id, req.userId!, ano, mes, req.body);
    return res.json(resultado);
  };
}

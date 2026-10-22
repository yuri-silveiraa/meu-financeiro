import type {
  TransacaoFiltersDTO,
  CreateTransacaoDTO,
  UpdateTransacaoDTO,
  TransacaoResponseDTO,
} from '../dtos/transacao.dto.js';

export interface ITransacoesService {
  list(userId: number, filters: TransacaoFiltersDTO): Promise<TransacaoResponseDTO[]>;
  findById(id: number, userId: number): Promise<TransacaoResponseDTO>;
  create(userId: number, data: CreateTransacaoDTO): Promise<TransacaoResponseDTO>;
  update(id: number, userId: number, data: UpdateTransacaoDTO): Promise<TransacaoResponseDTO>;
  delete(id: number, userId: number, mode?: 'single' | 'future' | 'all'): Promise<void>;
  togglePago(id: number, userId: number): Promise<{ success: boolean; pago: boolean }>;
  updateManyPago(ids: number[], userId: number, pago: boolean): Promise<{ success: boolean; count: number }>;
}

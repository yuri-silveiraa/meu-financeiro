import type {
  CreateCartaoDTO,
  UpdateCartaoDTO,
  CartaoResponseDTO,
  FaturaResumoDTO,
  FaturaDetalhadaDTO,
  PagarFaturaDTO,
} from '../dtos/cartao.dto.js';

export interface ICartoesService {
  list(userId: number): Promise<CartaoResponseDTO[]>;
  findById(id: number, userId: number): Promise<CartaoResponseDTO>;
  create(userId: number, data: CreateCartaoDTO): Promise<CartaoResponseDTO>;
  update(id: number, userId: number, data: UpdateCartaoDTO): Promise<CartaoResponseDTO>;
  delete(id: number, userId: number): Promise<void>;
  listFaturas(cartaoId: number, userId: number): Promise<FaturaResumoDTO[]>;
  getFaturaDetalhada(cartaoId: number, userId: number, ano: number, mes: number): Promise<FaturaDetalhadaDTO>;
  pagarFatura(cartaoId: number, userId: number, ano: number, mes: number, data: PagarFaturaDTO): Promise<{
    success: boolean;
    transacoes_pagas: number;
    mensagem: string;
  }>;
}

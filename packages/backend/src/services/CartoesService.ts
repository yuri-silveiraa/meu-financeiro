import type { ICartoesRepository } from '../types/repositories/ICartoesRepository.js';
import type { ICartoesService } from '../types/services/ICartoesService.js';
import type {
  CreateCartaoDTO,
  UpdateCartaoDTO,
  CartaoResponseDTO,
  FaturaResumoDTO,
  FaturaDetalhadaDTO,
  PagarFaturaDTO,
} from '../types/dtos/cartao.dto.js';
import { CartaoMapper } from '../mappers/CartaoMapper.js';
import { AppError } from '../errors/AppError.js';

export class CartoesService implements ICartoesService {
  constructor(private readonly repo: ICartoesRepository) {}

  async list(userId: number): Promise<CartaoResponseDTO[]> {
    const cartoes = await this.repo.findByUserId(userId);
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    const result = await Promise.all(
      cartoes.map(async (cartao) => {
        const [limiteComprometido, faturaStats] = await Promise.all([
          this.repo.getLimiteComprometido(cartao.id, userId),
          this.repo.getFaturaStats(cartao.id, userId, anoAtual, mesAtual),
        ]);

        return CartaoMapper.toDTO(cartao, {
          limiteComprometido,
          faturaAtualTotal: faturaStats.total,
          faturaAtualQtd: faturaStats.qtd,
        });
      })
    );

    return result;
  }

  async findById(id: number, userId: number): Promise<CartaoResponseDTO> {
    const cartao = await this.repo.findById(id, userId);
    if (!cartao) {
      throw new AppError('Cartão não encontrado', 404);
    }

    const limiteComprometido = await this.repo.getLimiteComprometido(id, userId);
    return CartaoMapper.toDTO(cartao, { limiteComprometido });
  }

  async create(userId: number, data: CreateCartaoDTO): Promise<CartaoResponseDTO> {
    const created = await this.repo.create({
      userId,
      nome: data.nome.trim(),
      bandeira: data.bandeira || 'outro',
      limite: data.limite,
      diaFechamento: data.dia_fechamento,
      diaVencimento: data.dia_vencimento,
      contaPadraoId: data.conta_padrao_id || null,
      cor: data.cor || '#6366f1',
    });

    return CartaoMapper.toDTO(created);
  }

  async update(id: number, userId: number, data: UpdateCartaoDTO): Promise<CartaoResponseDTO> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Cartão não encontrado', 404);
    }

    const updated = await this.repo.update(id, userId, {
      ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
      ...(data.bandeira !== undefined ? { bandeira: data.bandeira } : {}),
      ...(data.limite !== undefined ? { limite: data.limite } : {}),
      ...(data.dia_fechamento !== undefined ? { diaFechamento: data.dia_fechamento } : {}),
      ...(data.dia_vencimento !== undefined ? { diaVencimento: data.dia_vencimento } : {}),
      ...(data.conta_padrao_id !== undefined ? { contaPadraoId: data.conta_padrao_id } : {}),
      ...(data.cor !== undefined ? { cor: data.cor } : {}),
    });

    return CartaoMapper.toDTO(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Cartão não encontrado', 404);
    }

    await this.repo.delete(id, userId);
  }

  async listFaturas(cartaoId: number, userId: number): Promise<FaturaResumoDTO[]> {
    const cartao = await this.repo.findById(cartaoId, userId);
    if (!cartao) {
      throw new AppError('Cartão não encontrado', 404);
    }

    const faturas = await this.repo.findFaturasGrouped(cartaoId, userId);
    return faturas.map((f) => CartaoMapper.toFaturaResumoDTO(f, cartao.diaVencimento));
  }

  async getFaturaDetalhada(cartaoId: number, userId: number, ano: number, mes: number): Promise<FaturaDetalhadaDTO> {
    const cartao = await this.repo.findById(cartaoId, userId);
    if (!cartao) {
      throw new AppError('Cartão não encontrado', 404);
    }

    const transacoes = await this.repo.findTransacoesFatura(cartaoId, userId, ano, mes);
    return CartaoMapper.toFaturaDetalhadaDTO(cartao, ano, mes, transacoes);
  }

  async pagarFatura(
    cartaoId: number,
    userId: number,
    ano: number,
    mes: number,
    data: PagarFaturaDTO
  ): Promise<{ success: boolean; transacoes_pagas: number; mensagem: string }> {
    const cartao = await this.repo.findById(cartaoId, userId);
    if (!cartao) {
      throw new AppError('Cartão não encontrado', 404);
    }

    const contaId = data.conta_id !== undefined ? data.conta_id : cartao.contaPadraoId;
    const pagasCount = await this.repo.pagarFatura(cartaoId, userId, ano, mes, contaId);

    return {
      success: true,
      transacoes_pagas: pagasCount,
      mensagem: `Fatura ${mes}/${ano} do cartão ${cartao.nome} liquidada com sucesso!`,
    };
  }
}

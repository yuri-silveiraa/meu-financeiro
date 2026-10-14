import { randomUUID } from 'crypto';
import type { ITransacoesRepository } from '../types/repositories/ITransacoesRepository.js';
import type { ICartoesRepository } from '../types/repositories/ICartoesRepository.js';
import type { ITransacoesService } from '../types/services/ITransacoesService.js';
import type {
  TransacaoFiltersDTO,
  CreateTransacaoDTO,
  UpdateTransacaoDTO,
  TransacaoResponseDTO,
} from '../types/dtos/transacao.dto.js';
import { TransacaoMapper } from '../mappers/TransacaoMapper.js';
import { calcularFaturaEVencimento, gerarParcelas } from '../utils/fatura.js';
import { AppError } from '../errors/AppError.js';

export class TransacoesService implements ITransacoesService {
  constructor(
    private readonly repo: ITransacoesRepository,
    private readonly cartoesRepo?: ICartoesRepository
  ) {}

  async list(userId: number, filters: TransacaoFiltersDTO): Promise<TransacaoResponseDTO[]> {
    const limit = Math.min(filters.limit || 500, 1000);
    const transacoes = await this.repo.findManyWithFilters(userId, filters, limit);
    return TransacaoMapper.toDTOList(transacoes);
  }

  async findById(id: number, userId: number): Promise<TransacaoResponseDTO> {
    const t = await this.repo.findById(id, userId);
    if (!t) {
      throw new AppError('Transação não encontrada', 404);
    }
    return TransacaoMapper.toDTO(t);
  }

  async create(userId: number, data: CreateTransacaoDTO): Promise<TransacaoResponseDTO> {
    // Caso de pagamento com cartão de crédito
    if (data.tipo_pagamento === 'credito' && data.cartao_id && this.cartoesRepo) {
      const cartao = await this.cartoesRepo.findById(data.cartao_id, userId);
      if (!cartao) {
        throw new AppError('Cartão não encontrado', 404);
      }

      const totalParcelas = Math.max(1, data.total_parcelas || 1);

      if (totalParcelas > 1) {
        const parcelasCalculadas = gerarParcelas({
          dataCompra: data.data,
          valorTotal: data.valor,
          totalParcelas,
          diaFechamento: cartao.diaFechamento,
          diaVencimento: cartao.diaVencimento,
        });

        const grupoId = randomUUID();
        let primeiraTransacao: any = null;

        for (const p of parcelasCalculadas) {
          const descParcela = data.descricao
            ? `${data.descricao.trim()} (${p.parcela_atual}/${p.total_parcelas})`
            : `Compra (${p.parcela_atual}/${p.total_parcelas})`;

          const created = await this.repo.create({
            userId,
            data: new Date(p.data),
            descricao: descParcela,
            valor: p.valor,
            tipo: data.tipo,
            tipoPagamento: 'credito',
            categoriaId: data.categoria_id || null,
            contaId: data.conta_id || null,
            cartaoId: data.cartao_id,
            pago: data.pago || false,
            gastoFixoId: data.gasto_fixo_id || null,
            parcelaAtual: p.parcela_atual,
            totalParcelas: p.total_parcelas,
            faturaMes: p.fatura_mes,
            faturaAno: p.fatura_ano,
            compraGrupoId: grupoId,
          });

          if (!primeiraTransacao) {
            primeiraTransacao = created;
          }
        }

        return TransacaoMapper.toDTO(primeiraTransacao);
      } else {
        // Compra em 1x no cartão
        const faturaInfo = calcularFaturaEVencimento(data.data, cartao.diaFechamento, cartao.diaVencimento);
        const created = await this.repo.create({
          userId,
          data: new Date(faturaInfo.data_vencimento),
          descricao: data.descricao?.trim() || null,
          valor: data.valor,
          tipo: data.tipo,
          tipoPagamento: 'credito',
          categoriaId: data.categoria_id || null,
          contaId: data.conta_id || null,
          cartaoId: data.cartao_id,
          pago: data.pago || false,
          gastoFixoId: data.gasto_fixo_id || null,
          parcelaAtual: 1,
          totalParcelas: 1,
          faturaMes: faturaInfo.fatura_mes,
          faturaAno: faturaInfo.fatura_ano,
        });

        return TransacaoMapper.toDTO(created);
      }
    }

    // Transação padrão
    const created = await this.repo.create({
      userId,
      data: new Date(data.data),
      descricao: data.descricao?.trim() || null,
      valor: data.valor,
      tipo: data.tipo,
      tipoPagamento: data.tipo_pagamento || null,
      categoriaId: data.categoria_id || null,
      contaId: data.conta_id || null,
      cartaoId: data.cartao_id || null,
      pago: data.pago || false,
      gastoFixoId: data.gasto_fixo_id || null,
      totalParcelas: 1,
    });

    return TransacaoMapper.toDTO(created);
  }

  async update(id: number, userId: number, data: UpdateTransacaoDTO): Promise<TransacaoResponseDTO> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Transação não encontrada', 404);
    }

    const updated = await this.repo.update(id, userId, {
      ...(data.data !== undefined ? { data: new Date(data.data) } : {}),
      ...(data.descricao !== undefined ? { descricao: data.descricao?.trim() || null } : {}),
      ...(data.valor !== undefined ? { valor: data.valor } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      ...(data.tipo_pagamento !== undefined ? { tipoPagamento: data.tipo_pagamento || null } : {}),
      ...(data.categoria_id !== undefined ? { categoriaId: data.categoria_id || null } : {}),
      ...(data.conta_id !== undefined ? { contaId: data.conta_id || null } : {}),
      ...(data.cartao_id !== undefined ? { cartaoId: data.cartao_id || null } : {}),
      ...(data.pago !== undefined ? { pago: data.pago } : {}),
      ...(data.gasto_fixo_id !== undefined ? { gastoFixoId: data.gasto_fixo_id || null } : {}),
    });

    return TransacaoMapper.toDTO(updated);
  }

  async delete(id: number, userId: number, mode: 'single' | 'future' | 'all' = 'single'): Promise<void> {
    const current = await this.repo.findById(id, userId);
    if (!current) {
      throw new AppError('Transação não encontrada', 404);
    }

    if (current.compraGrupoId && mode === 'all') {
      await this.repo.deleteByGrupo(current.compraGrupoId, userId);
    } else if (current.compraGrupoId && mode === 'future' && current.parcelaAtual !== null) {
      await this.repo.deleteFutureByGrupo(current.compraGrupoId, current.parcelaAtual, userId);
    } else {
      await this.repo.delete(id, userId);
    }
  }

  async togglePago(id: number, userId: number): Promise<{ success: boolean; pago: boolean }> {
    const current = await this.repo.findById(id, userId);
    if (!current) {
      throw new AppError('Transação não encontrada', 404);
    }

    const newPago = !current.pago;
    const resultPago = await this.repo.togglePago(id, userId, newPago);

    return {
      success: true,
      pago: resultPago,
    };
  }
}

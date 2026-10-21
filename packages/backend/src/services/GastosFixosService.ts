import type {
  IGastosFixosRepository,
  GastoFixoWithRelations,
  NovaTransacaoLote,
} from '../types/repositories/IGastosFixosRepository.js';
import type { IGastosFixosService } from '../types/services/IGastosFixosService.js';
import type {
  CreateGastoFixoDTO,
  UpdateGastoFixoDTO,
  GastoFixoResponseDTO,
} from '../types/dtos/gastoFixo.dto.js';
import { GastoFixoMapper } from '../mappers/GastoFixoMapper.js';
import { AppError } from '../errors/AppError.js';
import { calcularFaturaEVencimento } from '../utils/fatura.js';

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export class GastosFixosService implements IGastosFixosService {
  constructor(private readonly repo: IGastosFixosRepository) {}

  async list(userId: number): Promise<GastoFixoResponseDTO[]> {
    await this.sincronizarGastosFixos(userId);
    const list = await this.repo.findByUserId(userId);
    return GastoFixoMapper.toDTOList(list);
  }

  async findById(id: number, userId: number): Promise<GastoFixoResponseDTO> {
    const gf = await this.repo.findById(id, userId);
    if (!gf) {
      throw new AppError('Gasto fixo não encontrado', 404);
    }
    return GastoFixoMapper.toDTO(gf);
  }

  private gerarTransacaoMes(gf: GastoFixoWithRelations, ano: number, mes: number): NovaTransacaoLote {
    const effectiveDay = Math.min(gf.diaVencimento, lastDayOfMonth(ano, mes));
    const dataTransacao = new Date(Date.UTC(ano, mes - 1, effectiveDay));

    let faturaMes: number | null = null;
    let faturaAno: number | null = null;
    let dataFinal = dataTransacao;

    if (gf.tipoPagamento === 'credito' && gf.cartao) {
      const dataCompraStr = `${ano}-${String(mes).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
      const faturaInfo = calcularFaturaEVencimento(
        dataCompraStr,
        gf.cartao.diaFechamento,
        gf.cartao.diaVencimento
      );
      faturaMes = faturaInfo.fatura_mes;
      faturaAno = faturaInfo.fatura_ano;
      dataFinal = new Date(faturaInfo.data_vencimento);
    }

    return {
      userId: gf.userId,
      data: dataFinal,
      descricao: gf.nome.trim(),
      valor: Number(gf.valor),
      tipo: gf.tipo || 'despesa',
      tipoPagamento: gf.tipoPagamento || 'pix',
      categoriaId: gf.categoriaId,
      contaId: gf.contaId,
      cartaoId: gf.cartaoId,
      pago: false,
      gastoFixoId: gf.id,
      parcelaAtual: null,
      totalParcelas: 1,
      faturaMes,
      faturaAno,
    };
  }

  async create(userId: number, data: CreateGastoFixoDTO): Promise<GastoFixoResponseDTO & { transacoesCriadas: number }> {
    const tipoFinal = data.tipo || 'despesa';
    const diaVencimentoFinal = data.dia_vencimento || 1;

    const created = await this.repo.create({
      userId,
      nome: data.nome.trim(),
      valor: data.valor,
      diaVencimento: diaVencimentoFinal,
      tipoPagamento: data.tipo_pagamento || null,
      categoriaId: data.categoria_id || null,
      contaId: data.conta_id || null,
      cartaoId: data.cartao_id || null,
      totalParcelas: null,
      tipo: tipoFinal,
      dataCriacao: new Date(),
    });

    const hoje = new Date();
    const currAno = hoje.getFullYear();
    const currMes = hoje.getMonth() + 1;

    // Gera apenas 1 transação (do mês atual) para não comprometer limites futuros
    const transacao = this.gerarTransacaoMes(created, currAno, currMes);
    const transacoesCriadas = await this.repo.createTransacoesLote([transacao]);

    return {
      ...GastoFixoMapper.toDTO(created),
      transacoesCriadas,
    };
  }

  async update(id: number, userId: number, data: UpdateGastoFixoDTO): Promise<GastoFixoResponseDTO> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Gasto fixo não encontrado', 404);
    }

    const updated = await this.repo.update(id, userId, {
      ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
      ...(data.valor !== undefined ? { valor: data.valor } : {}),
      ...(data.dia_vencimento !== undefined ? { diaVencimento: data.dia_vencimento } : {}),
      ...(data.tipo_pagamento !== undefined ? { tipoPagamento: data.tipo_pagamento } : {}),
      ...(data.categoria_id !== undefined ? { categoriaId: data.categoria_id } : {}),
      ...(data.conta_id !== undefined ? { contaId: data.conta_id } : {}),
      ...(data.cartao_id !== undefined ? { cartaoId: data.cartao_id } : {}),
      totalParcelas: null,
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
    });

    // Atualiza transações pendentes não pagas
    await this.repo.updateTransacoesNaoPagas(id, userId, {
      ...(data.valor !== undefined ? { valor: data.valor } : {}),
      ...(data.nome !== undefined ? { descricao: data.nome.trim() } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      ...(data.tipo_pagamento !== undefined ? { tipoPagamento: data.tipo_pagamento } : {}),
      ...(data.categoria_id !== undefined ? { categoriaId: data.categoria_id } : {}),
      ...(data.conta_id !== undefined ? { contaId: data.conta_id } : {}),
      ...(data.cartao_id !== undefined ? { cartaoId: data.cartao_id } : {}),
    });

    const hoje = new Date();
    await this.repo.deleteTransacoesFuturasNaoPagas(userId, hoje.getFullYear(), hoje.getMonth() + 1);

    return GastoFixoMapper.toDTO(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Gasto fixo não encontrado', 404);
    }
    await this.repo.softDelete(id, userId);
  }

  async sincronizarGastosFixos(userId: number): Promise<void> {
    if (!userId) return;

    try {
      const hoje = new Date();
      const currAno = hoje.getFullYear();
      const currMes = hoje.getMonth() + 1;

      // 1. Limpa transações não pagas de meses futuros para liberar o limite do cartão
      await this.repo.deleteTransacoesFuturasNaoPagas(userId, currAno, currMes);

      // 2. Busca todos os gastos fixos ativos
      const ativos = await this.repo.findAtivos(userId);

      // 3. Garante que cada gasto fixo ativo tenha exatamente uma transação no mês corrente
      const novasTransacoes: NovaTransacaoLote[] = [];

      for (const gf of ativos) {
        const isCartao = gf.tipoPagamento === 'credito' && Boolean(gf.cartaoId);
        const jaExiste = await this.repo.existeTransacaoNoMes(gf.id, userId, currAno, currMes, isCartao);

        if (!jaExiste) {
          const t = this.gerarTransacaoMes(gf, currAno, currMes);
          novasTransacoes.push(t);
        }
      }

      if (novasTransacoes.length > 0) {
        await this.repo.createTransacoesLote(novasTransacoes);
      }
    } catch (err) {
      console.error('Erro ao sincronizar gastos fixos:', err);
    }
  }

  // Alias para manter compatibilidade com interface
  async sincronizarParcelas(userId: number): Promise<void> {
    return this.sincronizarGastosFixos(userId);
  }
}

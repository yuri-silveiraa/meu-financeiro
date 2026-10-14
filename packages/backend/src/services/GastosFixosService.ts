import type {
  IGastosFixosRepository,
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

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export class GastosFixosService implements IGastosFixosService {
  constructor(private readonly repo: IGastosFixosRepository) {}

  async list(userId: number): Promise<GastoFixoResponseDTO[]> {
    await this.sincronizarParcelas(userId);
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
      totalParcelas: data.total_parcelas || null,
      tipo: tipoFinal,
      dataCriacao: new Date(),
    });

    const hoje = new Date();
    const currAno = hoje.getFullYear();
    const currMes = hoje.getMonth() + 1;
    const qtdParaGerar = data.total_parcelas ? data.total_parcelas : 12;

    const transacoes: NovaTransacaoLote[] = [];

    for (let i = 0; i < qtdParaGerar; i++) {
      let m = currMes + i;
      let a = currAno;
      while (m > 12) {
        m -= 12;
        a += 1;
      }

      const effectiveDay = Math.min(diaVencimentoFinal, lastDayOfMonth(a, m));
      const dataTransacao = new Date(Date.UTC(a, m - 1, effectiveDay));

      transacoes.push({
        userId,
        data: dataTransacao,
        descricao: data.nome.trim(),
        valor: data.valor,
        tipo: tipoFinal,
        tipoPagamento: data.tipo_pagamento || 'pix',
        categoriaId: data.categoria_id || null,
        contaId: data.conta_id || null,
        cartaoId: data.cartao_id || null,
        pago: false,
        gastoFixoId: created.id,
        parcelaAtual: data.total_parcelas ? i + 1 : null,
        totalParcelas: data.total_parcelas || 1,
        faturaMes: data.cartao_id ? m : null,
        faturaAno: data.cartao_id ? a : null,
      });
    }

    const transacoesCriadas = await this.repo.createTransacoesLote(transacoes);

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
      ...(data.total_parcelas !== undefined ? { totalParcelas: data.total_parcelas } : {}),
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

    // Se possui total_parcelas, verifica se faltam parcelas para gerar
    if (data.total_parcelas) {
      const stats = await this.repo.getTransacoesStats(id, userId);
      const faltam = data.total_parcelas - stats.pagasCount - stats.naoPagasCount;

      if (faltam > 0) {
        const parcelaBase = stats.maxParcela ? stats.maxParcela + 1 : stats.pagasCount + stats.naoPagasCount + 1;
        const lastDate = stats.maxData ? new Date(stats.maxData) : new Date();

        let currMes = lastDate.getUTCMonth() + 1;
        let currAno = lastDate.getUTCFullYear();

        if (stats.maxData) {
          currMes += 1;
          if (currMes > 12) {
            currMes = 1;
            currAno += 1;
          }
        }

        const diaVenc = data.dia_vencimento || existing.diaVencimento;
        const novasTransacoes: NovaTransacaoLote[] = [];

        for (let i = 0; i < faltam; i++) {
          const effectiveDay = Math.min(diaVenc, lastDayOfMonth(currAno, currMes));
          const dataTransacao = new Date(Date.UTC(currAno, currMes - 1, effectiveDay));

          novasTransacoes.push({
            userId,
            data: dataTransacao,
            descricao: data.nome?.trim() || existing.nome,
            valor: data.valor !== undefined ? data.valor : Number(existing.valor),
            tipo: data.tipo || existing.tipo || 'despesa',
            tipoPagamento: data.tipo_pagamento || existing.tipoPagamento || 'pix',
            categoriaId: data.categoria_id !== undefined ? data.categoria_id : existing.categoriaId,
            contaId: data.conta_id !== undefined ? data.conta_id : existing.contaId,
            cartaoId: data.cartao_id !== undefined ? data.cartao_id : existing.cartaoId,
            pago: false,
            gastoFixoId: id,
            parcelaAtual: parcelaBase + i,
            totalParcelas: data.total_parcelas,
            faturaMes: (data.cartao_id !== undefined ? data.cartao_id : existing.cartaoId) ? currMes : null,
            faturaAno: (data.cartao_id !== undefined ? data.cartao_id : existing.cartaoId) ? currAno : null,
          });

          currMes += 1;
          if (currMes > 12) {
            currMes = 1;
            currAno += 1;
          }
        }

        await this.repo.createTransacoesLote(novasTransacoes);
      }
    }

    return GastoFixoMapper.toDTO(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) {
      throw new AppError('Gasto fixo não encontrado', 404);
    }
    await this.repo.softDelete(id, userId);
  }

  async sincronizarParcelas(userId: number): Promise<void> {
    if (!userId) return;

    try {
      const ativos = await this.repo.findAtivosComParcelas(userId);

      for (const gf of ativos) {
        if (!gf.totalParcelas) continue;

        const stats = await this.repo.getTransacoesStats(gf.id, userId);
        const faltam = gf.totalParcelas - stats.count;

        if (faltam > 0) {
          const maxParcela = stats.maxParcela ? stats.maxParcela : stats.count;
          const lastDate = stats.maxData ? new Date(stats.maxData) : (gf.dataCriacao ? new Date(gf.dataCriacao) : new Date());

          let currMes = lastDate.getUTCMonth() + 1;
          let currAno = lastDate.getUTCFullYear();

          if (stats.maxData) {
            currMes += 1;
            if (currMes > 12) {
              currMes = 1;
              currAno += 1;
            }
          }

          const diaVenc = (gf.tipoPagamento === 'credito' && gf.cartao?.diaVencimento)
            ? gf.cartao.diaVencimento
            : gf.diaVencimento;

          const novasTransacoes: NovaTransacaoLote[] = [];

          for (let i = 0; i < faltam; i++) {
            const pAtual = maxParcela + 1 + i;
            const effectiveDay = Math.min(diaVenc, lastDayOfMonth(currAno, currMes));
            const dataTransacao = new Date(Date.UTC(currAno, currMes - 1, effectiveDay));

            novasTransacoes.push({
              userId,
              data: dataTransacao,
              descricao: gf.nome,
              valor: Number(gf.valor),
              tipo: gf.tipo || 'despesa',
              tipoPagamento: gf.tipoPagamento || 'pix',
              categoriaId: gf.categoriaId,
              contaId: gf.contaId,
              cartaoId: gf.cartaoId,
              pago: false,
              gastoFixoId: gf.id,
              parcelaAtual: pAtual,
              totalParcelas: gf.totalParcelas,
              faturaMes: gf.cartaoId ? currMes : null,
              faturaAno: gf.cartaoId ? currAno : null,
            });

            currMes += 1;
            if (currMes > 12) {
              currMes = 1;
              currAno += 1;
            }
          }

          await this.repo.createTransacoesLote(novasTransacoes);
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar parcelas de gastos fixos:', err);
    }
  }
}

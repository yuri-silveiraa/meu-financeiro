import { prisma } from '../config/prisma.js';
import type {
  IGastosFixosRepository,
  GastoFixoWithRelations,
  CreateGastoFixoData,
  UpdateGastoFixoData,
  TransacaoStats,
  NovaTransacaoLote,
} from '../types/repositories/IGastosFixosRepository.js';

export class PrismaGastosFixosRepository implements IGastosFixosRepository {
  async findByUserId(userId: number): Promise<GastoFixoWithRelations[]> {
    return prisma.gastoFixo.findMany({
      where: { userId, ativo: true },
      include: {
        categoria: true,
        conta: true,
        cartao: true,
      },
      orderBy: { diaVencimento: 'asc' },
    });
  }

  async findById(id: number, userId: number): Promise<GastoFixoWithRelations | null> {
    return prisma.gastoFixo.findFirst({
      where: { id, userId },
      include: {
        categoria: true,
        conta: true,
        cartao: true,
      },
    });
  }

  async findAtivos(userId: number): Promise<GastoFixoWithRelations[]> {
    return prisma.gastoFixo.findMany({
      where: {
        userId,
        ativo: true,
      },
      include: {
        categoria: true,
        conta: true,
        cartao: true,
      },
      orderBy: { diaVencimento: 'asc' },
    });
  }

  async findAtivosComParcelas(userId: number): Promise<GastoFixoWithRelations[]> {
    return prisma.gastoFixo.findMany({
      where: {
        userId,
        ativo: true,
        totalParcelas: { not: null },
      },
      include: {
        categoria: true,
        conta: true,
        cartao: true,
      },
    });
  }

  async existeTransacaoNoMes(gastoFixoId: number, userId: number, ano: number, mes: number, isCartao: boolean): Promise<boolean> {
    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
    const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));
    const count = await prisma.transacao.count({
      where: {
        gastoFixoId,
        userId,
        OR: isCartao
          ? [
              { faturaAno: ano, faturaMes: mes },
              { data: { gte: inicioMes, lte: fimMes } },
            ]
          : [{ data: { gte: inicioMes, lte: fimMes } }],
      },
    });
    return count > 0;
  }

  async deleteTransacoesFuturasNaoPagas(userId: number, ano: number, mes: number): Promise<number> {
    const fimMesAtual = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));
    const result = await prisma.transacao.deleteMany({
      where: {
        userId,
        gastoFixoId: { not: null },
        pago: false,
        OR: [
          { faturaAno: { gt: ano } },
          { faturaAno: ano, faturaMes: { gt: mes } },
          { data: { gt: fimMesAtual } },
        ],
      },
    });
    return result.count;
  }

  async getTransacoesStats(gastoFixoId: number, userId: number): Promise<TransacaoStats> {
    const [totalCount, pagasCount, naoPagasCount, aggregate] = await Promise.all([
      prisma.transacao.count({ where: { gastoFixoId, userId } }),
      prisma.transacao.count({ where: { gastoFixoId, userId, pago: true } }),
      prisma.transacao.count({ where: { gastoFixoId, userId, pago: false } }),
      prisma.transacao.aggregate({
        where: { gastoFixoId, userId },
        _max: {
          parcelaAtual: true,
          data: true,
        },
      }),
    ]);

    return {
      count: totalCount,
      pagasCount,
      naoPagasCount,
      maxParcela: aggregate._max.parcelaAtual ?? null,
      maxData: aggregate._max.data ?? null,
    };
  }

  async create(data: CreateGastoFixoData): Promise<GastoFixoWithRelations> {
    return prisma.gastoFixo.create({
      data: {
        userId: data.userId,
        nome: data.nome,
        valor: data.valor,
        diaVencimento: data.diaVencimento,
        tipoPagamento: data.tipoPagamento,
        categoriaId: data.categoriaId,
        contaId: data.contaId,
        cartaoId: data.cartaoId,
        totalParcelas: data.totalParcelas,
        tipo: data.tipo,
        dataCriacao: data.dataCriacao,
      },
      include: {
        categoria: true,
        conta: true,
        cartao: true,
      },
    });
  }

  async update(id: number, userId: number, data: UpdateGastoFixoData): Promise<GastoFixoWithRelations> {
    return prisma.gastoFixo.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.valor !== undefined ? { valor: data.valor } : {}),
        ...(data.diaVencimento !== undefined ? { diaVencimento: data.diaVencimento } : {}),
        ...(data.tipoPagamento !== undefined ? { tipoPagamento: data.tipoPagamento } : {}),
        ...(data.categoriaId !== undefined ? { categoriaId: data.categoriaId } : {}),
        ...(data.contaId !== undefined ? { contaId: data.contaId } : {}),
        ...(data.cartaoId !== undefined ? { cartaoId: data.cartaoId } : {}),
        ...(data.totalParcelas !== undefined ? { totalParcelas: data.totalParcelas } : {}),
        ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      },
      include: {
        categoria: true,
        conta: true,
        cartao: true,
      },
    });
  }

  async updateTransacoesNaoPagas(gastoFixoId: number, userId: number, data: Partial<NovaTransacaoLote>): Promise<number> {
    const result = await prisma.transacao.updateMany({
      where: {
        gastoFixoId,
        userId,
        pago: false,
      },
      data: {
        ...(data.valor !== undefined ? { valor: data.valor } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
        ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
        ...(data.tipoPagamento !== undefined ? { tipoPagamento: data.tipoPagamento } : {}),
        ...(data.categoriaId !== undefined ? { categoriaId: data.categoriaId } : {}),
        ...(data.contaId !== undefined ? { contaId: data.contaId } : {}),
        ...(data.cartaoId !== undefined ? { cartaoId: data.cartaoId } : {}),
      },
    });

    return result.count;
  }

  async deleteTransacoesNaoPagas(gastoFixoId: number, userId: number): Promise<number> {
    const result = await prisma.transacao.deleteMany({
      where: {
        gastoFixoId,
        userId,
        pago: false,
      },
    });

    return result.count;
  }

  async createTransacoesLote(transacoes: NovaTransacaoLote[]): Promise<number> {
    if (transacoes.length === 0) return 0;

    const result = await prisma.transacao.createMany({
      data: transacoes.map((t) => ({
        userId: t.userId,
        data: t.data,
        descricao: t.descricao,
        valor: t.valor,
        tipo: t.tipo,
        tipoPagamento: t.tipoPagamento,
        categoriaId: t.categoriaId,
        contaId: t.contaId,
        cartaoId: t.cartaoId,
        pago: t.pago,
        gastoFixoId: t.gastoFixoId,
        parcelaAtual: t.parcelaAtual,
        totalParcelas: t.totalParcelas,
        faturaMes: t.faturaMes,
        faturaAno: t.faturaAno,
      })),
    });

    return result.count;
  }

  async removerDuplicatasGastosFixos(userId: number): Promise<number> {
    const transacoes = await prisma.transacao.findMany({
      where: {
        userId,
        gastoFixoId: { not: null },
        pago: false,
      },
      orderBy: { id: 'asc' },
    });

    const seen = new Set<string>();
    const idsToDelete: number[] = [];

    for (const t of transacoes) {
      const d = new Date(t.data);
      const ano = t.faturaAno || d.getUTCFullYear();
      const mes = t.faturaMes || (d.getUTCMonth() + 1);
      const key = `${t.gastoFixoId}_${ano}_${mes}`;

      if (seen.has(key)) {
        idsToDelete.push(t.id);
      } else {
        seen.add(key);
      }
    }

    if (idsToDelete.length > 0) {
      await prisma.transacao.deleteMany({
        where: {
          id: { in: idsToDelete },
          userId,
        },
      });
      return idsToDelete.length;
    }

    return 0;
  }

  async softDelete(id: number, userId: number): Promise<void> {
    await prisma.$transaction([
      prisma.gastoFixo.update({
        where: { id },
        data: { ativo: false },
      }),
      prisma.transacao.deleteMany({
        where: {
          gastoFixoId: id,
          userId,
          pago: false,
        },
      }),
    ]);
  }
}

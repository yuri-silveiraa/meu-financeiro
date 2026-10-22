import { prisma } from '../config/prisma.js';
import type {
  IEstatisticasRepository,
  ReceitasDespesasSummary,
  CategoriaAgregada,
  PagamentoAgregado,
  FaturasMesAgregada,
  CartaoLimiteInfo,
  ProjecaoFaturaRow,
  CartaoAnualRow,
} from '../types/repositories/IEstatisticasRepository.js';

export class PrismaEstatisticasRepository implements IEstatisticasRepository {
  async getReceitasDespesas(userId: number, startDate: Date, endDate: Date, ano: number, mes: number): Promise<ReceitasDespesasSummary> {
    const [recAgg, despAgg, despNaoPagasAgg] = await Promise.all([
      prisma.transacao.aggregate({
        where: {
          userId,
          tipo: 'receita',
          data: { gte: startDate, lte: endDate },
        },
        _sum: { valor: true },
      }),
      prisma.transacao.aggregate({
        where: {
          userId,
          tipo: 'despesa',
          OR: [
            { cartaoId: null, data: { gte: startDate, lte: endDate } },
            { cartaoId: { not: null }, faturaAno: ano, faturaMes: mes },
          ],
        },
        _sum: { valor: true },
      }),
      prisma.transacao.aggregate({
        where: {
          userId,
          tipo: 'despesa',
          pago: false,
          OR: [
            { cartaoId: null, data: { gte: startDate, lte: endDate } },
            { cartaoId: { not: null }, faturaAno: ano, faturaMes: mes },
          ],
        },
        _sum: { valor: true },
      }),
    ]);

    return {
      receitasTotal: recAgg._sum.valor ? Number(recAgg._sum.valor) : 0,
      despesasTotal: despAgg._sum.valor ? Number(despAgg._sum.valor) : 0,
      despesasNaoPagasTotal: despNaoPagasAgg._sum.valor ? Number(despNaoPagasAgg._sum.valor) : 0,
    };
  }

  async getPorCategoria(userId: number, startDate: Date, endDate: Date, ano: number, mes: number): Promise<CategoriaAgregada[]> {
    const transacoes = await prisma.transacao.findMany({
      where: {
        userId,
        tipo: 'despesa',
        categoriaId: { not: null },
        OR: [
          { cartaoId: null, data: { gte: startDate, lte: endDate } },
          { cartaoId: { not: null }, faturaAno: ano, faturaMes: mes },
        ],
      },
      include: {
        categoria: true,
      },
    });

    const catMap = new Map<number, { nome: string; cor: string; total: number }>();
    for (const t of transacoes) {
      if (!t.categoria) continue;
      const current = catMap.get(t.categoria.id) || {
        nome: t.categoria.nome,
        cor: t.categoria.cor ?? '#6366f1',
        total: 0,
      };
      current.total += Number(t.valor);
      catMap.set(t.categoria.id, current);
    }

    return Array.from(catMap.values()).sort((a, b) => b.total - a.total);
  }

  async getPorPagamento(userId: number, startDate: Date, endDate: Date, ano: number, mes: number): Promise<PagamentoAgregado[]> {
    const transacoes = await prisma.transacao.findMany({
      where: {
        userId,
        tipo: 'despesa',
        tipoPagamento: { not: null },
        OR: [
          { cartaoId: null, data: { gte: startDate, lte: endDate } },
          { cartaoId: { not: null }, faturaAno: ano, faturaMes: mes },
        ],
      },
      select: {
        tipoPagamento: true,
        valor: true,
      },
    });

    const payMap = new Map<string, number>();
    for (const t of transacoes) {
      if (!t.tipoPagamento) continue;
      const current = payMap.get(t.tipoPagamento) || 0;
      payMap.set(t.tipoPagamento, current + Number(t.valor));
    }

    return Array.from(payMap.entries()).map(([tipo_pagamento, total]) => ({
      tipo_pagamento,
      total,
    }));
  }

  async getFaturasMes(userId: number, ano: number, mes: number): Promise<FaturasMesAgregada> {
    const transacoes = await prisma.transacao.findMany({
      where: {
        userId,
        cartaoId: { not: null },
        tipo: 'despesa',
        faturaAno: ano,
        faturaMes: mes,
      },
      select: {
        valor: true,
        pago: true,
      },
    });

    const total = transacoes.reduce((acc, t) => acc + Number(t.valor), 0);
    const totalPago = transacoes.filter((t) => t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const totalAberto = transacoes.filter((t) => !t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const todasPagas = transacoes.length > 0 && transacoes.every((t) => t.pago);

    return {
      total,
      totalPago,
      totalAberto,
      qtd: transacoes.length,
      todasPagas,
    };
  }

  async getLimitesCartoes(userId: number): Promise<CartaoLimiteInfo[]> {
    const cartoes = await prisma.cartao.findMany({
      where: { userId },
      orderBy: { nome: 'asc' },
    });

    return Promise.all(
      cartoes.map(async (c) => {
        const aggregate = await prisma.transacao.aggregate({
          where: {
            cartaoId: c.id,
            userId,
            tipo: 'despesa',
            pago: false,
            gastoFixoId: null,
          },
          _sum: { valor: true },
        });

        return {
          id: c.id,
          nome: c.nome,
          cor: c.cor,
          limite: Number(c.limite),
          comprometido: aggregate._sum.valor ? Number(aggregate._sum.valor) : 0,
        };
      })
    );
  }

  async getProjecaoFaturas(userId: number): Promise<ProjecaoFaturaRow[]> {
    const transacoes = await prisma.transacao.findMany({
      where: {
        userId,
        tipo: 'despesa',
        faturaAno: { not: null },
        faturaMes: { not: null },
        cartaoId: { not: null },
      },
      include: {
        cartao: true,
      },
    });

    const groupMap = new Map<string, ProjecaoFaturaRow>();
    for (const t of transacoes) {
      if (!t.cartao || !t.faturaAno || !t.faturaMes) continue;
      const key = `${t.faturaAno}-${t.faturaMes}-${t.cartao.nome}`;
      const current = groupMap.get(key) || {
        faturaAno: t.faturaAno,
        faturaMes: t.faturaMes,
        cartaoNome: t.cartao.nome,
        total: 0,
      };
      current.total += Number(t.valor);
      groupMap.set(key, current);
    }

    return Array.from(groupMap.values());
  }

  async getCartoesAnual(userId: number, ano: number): Promise<CartaoAnualRow[]> {
    const transacoes = await prisma.transacao.findMany({
      where: {
        userId,
        tipo: 'despesa',
        faturaAno: ano,
        cartaoId: { not: null },
      },
      include: {
        cartao: true,
      },
    });

    const groupMap = new Map<string, CartaoAnualRow>();
    for (const t of transacoes) {
      if (!t.cartao || !t.faturaMes) continue;
      const key = `${t.faturaMes}-${t.cartao.id}`;
      const current = groupMap.get(key) || {
        faturaMes: t.faturaMes,
        cartaoId: t.cartao.id,
        cartaoNome: t.cartao.nome,
        cartaoCor: t.cartao.cor,
        total: 0,
        totalPago: 0,
        totalAberto: 0,
      };
      const val = Number(t.valor);
      current.total += val;
      if (t.pago) current.totalPago += val;
      else current.totalAberto += val;
      groupMap.set(key, current);
    }

    return Array.from(groupMap.values());
  }
}

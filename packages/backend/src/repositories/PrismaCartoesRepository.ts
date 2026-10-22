import { prisma } from '../config/prisma.js';
import type {
  ICartoesRepository,
  CartaoWithConta,
  TransacaoFatura,
  CreateCartaoData,
  UpdateCartaoData,
  FaturaGroupedRow,
} from '../types/repositories/ICartoesRepository.js';

export class PrismaCartoesRepository implements ICartoesRepository {
  async findByUserId(userId: number): Promise<CartaoWithConta[]> {
    return prisma.cartao.findMany({
      where: { userId },
      include: {
        contaPadrao: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number, userId: number): Promise<CartaoWithConta | null> {
    return prisma.cartao.findFirst({
      where: { id, userId },
      include: {
        contaPadrao: true,
      },
    });
  }

  async getLimiteComprometido(cartaoId: number, userId: number): Promise<number> {
    const aggregate = await prisma.transacao.aggregate({
      where: {
        cartaoId,
        userId,
        tipo: 'despesa',
        pago: false,
        gastoFixoId: null,
      },
      _sum: {
        valor: true,
      },
    });
    return aggregate._sum.valor ? Number(aggregate._sum.valor) : 0;
  }

  async getFaturaStats(cartaoId: number, userId: number, ano: number, mes: number): Promise<{ total: number; qtd: number }> {
    const [aggregate, count] = await Promise.all([
      prisma.transacao.aggregate({
        where: {
          cartaoId,
          userId,
          tipo: 'despesa',
          faturaAno: ano,
          faturaMes: mes,
        },
        _sum: {
          valor: true,
        },
      }),
      prisma.transacao.count({
        where: {
          cartaoId,
          userId,
          tipo: 'despesa',
          faturaAno: ano,
          faturaMes: mes,
        },
      }),
    ]);

    return {
      total: aggregate._sum.valor ? Number(aggregate._sum.valor) : 0,
      qtd: count,
    };
  }

  async create(data: CreateCartaoData): Promise<CartaoWithConta> {
    return prisma.cartao.create({
      data: {
        userId: data.userId,
        nome: data.nome,
        bandeira: data.bandeira,
        limite: data.limite,
        diaFechamento: data.diaFechamento,
        diaVencimento: data.diaVencimento,
        contaPadraoId: data.contaPadraoId,
        cor: data.cor,
      },
      include: {
        contaPadrao: true,
      },
    });
  }

  async update(id: number, userId: number, data: UpdateCartaoData): Promise<CartaoWithConta> {
    return prisma.cartao.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.bandeira !== undefined ? { bandeira: data.bandeira } : {}),
        ...(data.limite !== undefined ? { limite: data.limite } : {}),
        ...(data.diaFechamento !== undefined ? { diaFechamento: data.diaFechamento } : {}),
        ...(data.diaVencimento !== undefined ? { diaVencimento: data.diaVencimento } : {}),
        ...(data.contaPadraoId !== undefined ? { contaPadraoId: data.contaPadraoId } : {}),
        ...(data.cor !== undefined ? { cor: data.cor } : {}),
      },
      include: {
        contaPadrao: true,
      },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await prisma.$transaction([
      prisma.transacao.updateMany({
        where: { cartaoId: id, userId },
        data: { cartaoId: null },
      }),
      prisma.gastoFixo.updateMany({
        where: { cartaoId: id, userId },
        data: { cartaoId: null },
      }),
      prisma.cartao.delete({
        where: { id },
      }),
    ]);
  }

  async findFaturasGrouped(cartaoId: number, userId: number): Promise<FaturaGroupedRow[]> {
    const grouped = await prisma.transacao.groupBy({
      by: ['faturaAno', 'faturaMes'],
      where: {
        cartaoId,
        userId,
        tipo: 'despesa',
        faturaAno: { not: null },
        faturaMes: { not: null },
      },
      _count: {
        _all: true,
      },
      _sum: {
        valor: true,
      },
      orderBy: [
        { faturaAno: 'desc' },
        { faturaMes: 'desc' },
      ],
    });

    const result: FaturaGroupedRow[] = [];

    for (const item of grouped) {
      if (item.faturaAno === null || item.faturaMes === null) continue;

      const unpaidCount = await prisma.transacao.count({
        where: {
          cartaoId,
          userId,
          tipo: 'despesa',
          faturaAno: item.faturaAno,
          faturaMes: item.faturaMes,
          pago: false,
        },
      });

      result.push({
        faturaAno: item.faturaAno,
        faturaMes: item.faturaMes,
        quantidade: item._count._all,
        total: item._sum.valor ? Number(item._sum.valor) : 0,
        pago: unpaidCount === 0,
      });
    }

    return result;
  }

  async findTransacoesFatura(cartaoId: number, userId: number, ano: number, mes: number): Promise<TransacaoFatura[]> {
    return prisma.transacao.findMany({
      where: {
        cartaoId,
        userId,
        faturaAno: ano,
        faturaMes: mes,
      },
      include: {
        categoria: true,
      },
      orderBy: [
        { data: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  async pagarFatura(cartaoId: number, userId: number, ano: number, mes: number, contaId: number | null): Promise<number> {
    const result = await prisma.transacao.updateMany({
      where: {
        cartaoId,
        userId,
        faturaAno: ano,
        faturaMes: mes,
        pago: false,
      },
      data: {
        pago: true,
        ...(contaId !== null ? { contaId } : {}),
      },
    });

    return result.count;
  }
}

import { prisma } from '../config/prisma.js';
import type { Prisma } from '@prisma/client';
import type {
  ITransacoesRepository,
  TransacaoWithRelations,
} from '../types/repositories/ITransacoesRepository.js';
import type { TransacaoFiltersDTO } from '../types/dtos/transacao.dto.js';
import { AppError } from '../errors/AppError.js';

export class PrismaTransacoesRepository implements ITransacoesRepository {
  async findManyWithFilters(userId: number, filters: TransacaoFiltersDTO, limit: number): Promise<TransacaoWithRelations[]> {
    const where: Prisma.TransacaoWhereInput = {
      userId,
      ...(filters.dataInicio ? { data: { gte: new Date(filters.dataInicio) } } : {}),
      ...(filters.dataFim ? { data: { lte: new Date(filters.dataFim) } } : {}),
      ...(filters.categoriaId ? { categoriaId: filters.categoriaId } : {}),
      ...(filters.contaId ? { contaId: filters.contaId } : {}),
      ...(filters.cartaoId ? { cartaoId: filters.cartaoId } : {}),
      ...(filters.faturaMes ? { faturaMes: filters.faturaMes } : {}),
      ...(filters.faturaAno ? { faturaAno: filters.faturaAno } : {}),
      ...(filters.tipo ? { tipo: filters.tipo } : {}),
      ...(filters.pago !== undefined ? { pago: filters.pago } : {}),
    };

    return prisma.transacao.findMany({
      where,
      include: {
        categoria: true,
        conta: true,
        cartao: true,
        gastoFixo: true,
      },
      orderBy: [
        { data: 'desc' },
        { id: 'desc' },
      ],
      take: limit,
    });
  }

  async findById(id: number, userId: number): Promise<TransacaoWithRelations | null> {
    return prisma.transacao.findFirst({
      where: { id, userId },
      include: {
        categoria: true,
        conta: true,
        cartao: true,
        gastoFixo: true,
      },
    });
  }

  async create(data: Prisma.TransacaoUncheckedCreateInput): Promise<TransacaoWithRelations> {
    const created = await prisma.transacao.create({
      data,
      include: {
        categoria: true,
        conta: true,
        cartao: true,
        gastoFixo: true,
      },
    });
    return created;
  }

  async createMany(data: Prisma.TransacaoUncheckedCreateInput[]): Promise<number> {
    const result = await prisma.transacao.createMany({
      data,
    });
    return result.count;
  }

  async update(id: number, userId: number, data: Prisma.TransacaoUncheckedUpdateInput): Promise<TransacaoWithRelations> {
    return prisma.transacao.update({
      where: { id },
      data,
      include: {
        categoria: true,
        conta: true,
        cartao: true,
        gastoFixo: true,
      },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await prisma.transacao.delete({
      where: { id },
    });
  }

  async deleteByGrupo(compraGrupoId: string, userId: number): Promise<void> {
    await prisma.transacao.deleteMany({
      where: {
        compraGrupoId,
        userId,
      },
    });
  }

  async deleteFutureByGrupo(compraGrupoId: string, parcelaAtual: number, userId: number): Promise<void> {
    await prisma.transacao.deleteMany({
      where: {
        compraGrupoId,
        userId,
        parcelaAtual: { gte: parcelaAtual },
      },
    });
  }

  async togglePago(id: number, userId: number, newPago: boolean): Promise<boolean> {
    const updated = await prisma.transacao.update({
      where: { id },
      data: { pago: newPago },
      select: { pago: true },
    });
    return Boolean(updated.pago);
  }
}

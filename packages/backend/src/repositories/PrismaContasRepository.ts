import { prisma } from '../config/prisma.js';
import type {
  IContasRepository,
  CreateContaData,
  UpdateContaData,
} from '../types/repositories/IContasRepository.js';
import type { Conta } from '@prisma/client';

export class PrismaContasRepository implements IContasRepository {
  async findByUserId(userId: number): Promise<Conta[]> {
    return prisma.conta.findMany({
      where: { userId },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number, userId: number): Promise<Conta | null> {
    return prisma.conta.findFirst({
      where: { id, userId },
    });
  }

  async create(data: CreateContaData): Promise<Conta> {
    return prisma.conta.create({
      data: {
        userId: data.userId,
        nome: data.nome,
        banco: data.banco,
        tipoConta: data.tipoConta,
        saldoInicial: data.saldoInicial,
      },
    });
  }

  async update(id: number, userId: number, data: UpdateContaData): Promise<Conta> {
    return prisma.conta.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.banco !== undefined ? { banco: data.banco } : {}),
        ...(data.tipoConta !== undefined ? { tipoConta: data.tipoConta } : {}),
        ...(data.saldoInicial !== undefined ? { saldoInicial: data.saldoInicial } : {}),
      },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await prisma.$transaction([
      prisma.transacao.updateMany({
        where: { contaId: id, userId },
        data: { contaId: null },
      }),
      prisma.gastoFixo.updateMany({
        where: { contaId: id, userId },
        data: { contaId: null },
      }),
      prisma.cartao.updateMany({
        where: { contaPadraoId: id, userId },
        data: { contaPadraoId: null },
      }),
      prisma.conta.delete({
        where: { id },
      }),
    ]);
  }
}

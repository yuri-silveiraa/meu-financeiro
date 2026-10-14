import { prisma } from '../config/prisma.js';
import type {
  ICategoriasRepository,
  CreateCategoriaData,
  UpdateCategoriaData,
} from '../types/repositories/ICategoriasRepository.js';
import type { Categoria } from '@prisma/client';

export class PrismaCategoriasRepository implements ICategoriasRepository {
  async findByUserId(userId: number): Promise<Categoria[]> {
    return prisma.categoria.findMany({
      where: { userId },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number, userId: number): Promise<Categoria | null> {
    return prisma.categoria.findFirst({
      where: { id, userId },
    });
  }

  async create(data: CreateCategoriaData): Promise<Categoria> {
    return prisma.categoria.create({
      data: {
        userId: data.userId,
        nome: data.nome,
        cor: data.cor,
        icone: data.icone,
      },
    });
  }

  async update(id: number, userId: number, data: UpdateCategoriaData): Promise<Categoria> {
    return prisma.categoria.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.cor !== undefined ? { cor: data.cor } : {}),
        ...(data.icone !== undefined ? { icone: data.icone } : {}),
      },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await prisma.$transaction([
      prisma.transacao.updateMany({
        where: { categoriaId: id, userId },
        data: { categoriaId: null },
      }),
      prisma.meta.updateMany({
        where: { categoriaId: id, userId },
        data: { categoriaId: null },
      }),
      prisma.gastoFixo.updateMany({
        where: { categoriaId: id, userId },
        data: { categoriaId: null },
      }),
      prisma.categoria.delete({
        where: { id },
      }),
    ]);
  }
}

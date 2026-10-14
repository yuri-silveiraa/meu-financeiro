import { prisma } from '../config/prisma.js';
import type {
  IMetasRepository,
  MetaWithCategoria,
  CreateMetaData,
  UpdateMetaData,
} from '../types/repositories/IMetasRepository.js';

export class PrismaMetasRepository implements IMetasRepository {
  async findByUserId(userId: number): Promise<MetaWithCategoria[]> {
    return prisma.meta.findMany({
      where: { userId },
      include: {
        categoria: true,
      },
      orderBy: { prazo: 'asc' },
    });
  }

  async findById(id: number, userId: number): Promise<MetaWithCategoria | null> {
    return prisma.meta.findFirst({
      where: { id, userId },
      include: {
        categoria: true,
      },
    });
  }

  async create(data: CreateMetaData): Promise<MetaWithCategoria> {
    return prisma.meta.create({
      data: {
        userId: data.userId,
        nome: data.nome,
        valorMeta: data.valorMeta,
        valorAtual: data.valorAtual,
        prazo: data.prazo,
        categoriaId: data.categoriaId,
      },
      include: {
        categoria: true,
      },
    });
  }

  async update(id: number, userId: number, data: UpdateMetaData): Promise<MetaWithCategoria> {
    return prisma.meta.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.valorMeta !== undefined ? { valorMeta: data.valorMeta } : {}),
        ...(data.valorAtual !== undefined ? { valorAtual: data.valorAtual } : {}),
        ...(data.prazo !== undefined ? { prazo: data.prazo } : {}),
        ...(data.categoriaId !== undefined ? { categoriaId: data.categoriaId } : {}),
      },
      include: {
        categoria: true,
      },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await prisma.meta.delete({
      where: { id },
    });
  }
}

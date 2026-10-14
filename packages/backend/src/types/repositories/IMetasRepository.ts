import type { Meta, Categoria } from '@prisma/client';

export type MetaWithCategoria = Meta & {
  categoria: Categoria | null;
};

export interface CreateMetaData {
  userId: number;
  nome: string;
  valorMeta: number;
  valorAtual: number;
  prazo: Date | null;
  categoriaId: number | null;
}

export interface UpdateMetaData {
  nome?: string;
  valorMeta?: number;
  valorAtual?: number;
  prazo?: Date | null;
  categoriaId?: number | null;
}

export interface IMetasRepository {
  findByUserId(userId: number): Promise<MetaWithCategoria[]>;
  findById(id: number, userId: number): Promise<MetaWithCategoria | null>;
  create(data: CreateMetaData): Promise<MetaWithCategoria>;
  update(id: number, userId: number, data: UpdateMetaData): Promise<MetaWithCategoria>;
  delete(id: number, userId: number): Promise<void>;
}

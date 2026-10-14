import type { Categoria } from '@prisma/client';

export interface CreateCategoriaData {
  userId: number;
  nome: string;
  cor: string;
  icone: string;
}

export interface UpdateCategoriaData {
  nome?: string;
  cor?: string;
  icone?: string;
}

export interface ICategoriasRepository {
  findByUserId(userId: number): Promise<Categoria[]>;
  findById(id: number, userId: number): Promise<Categoria | null>;
  create(data: CreateCategoriaData): Promise<Categoria>;
  update(id: number, userId: number, data: UpdateCategoriaData): Promise<Categoria>;
  delete(id: number, userId: number): Promise<void>;
}

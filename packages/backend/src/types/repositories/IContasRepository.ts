import type { Conta } from '@prisma/client';

export interface CreateContaData {
  userId: number;
  nome: string;
  banco: string | null;
  tipoConta: string;
  saldoInicial: number;
}

export interface UpdateContaData {
  nome?: string;
  banco?: string | null;
  tipoConta?: string;
  saldoInicial?: number;
}

export interface IContasRepository {
  findByUserId(userId: number): Promise<Conta[]>;
  findById(id: number, userId: number): Promise<Conta | null>;
  create(data: CreateContaData): Promise<Conta>;
  update(id: number, userId: number, data: UpdateContaData): Promise<Conta>;
  delete(id: number, userId: number): Promise<void>;
}

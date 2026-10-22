import type { Transacao, Categoria, Conta, Cartao, GastoFixo, Prisma } from '@prisma/client';
import type { TransacaoFiltersDTO } from '../dtos/transacao.dto.js';

export type TransacaoWithRelations = Transacao & {
  categoria: Categoria | null;
  conta: Conta | null;
  cartao: Cartao | null;
  gastoFixo: GastoFixo | null;
};

export interface ITransacoesRepository {
  findManyWithFilters(userId: number, filters: TransacaoFiltersDTO, limit: number): Promise<TransacaoWithRelations[]>;
  findById(id: number, userId: number): Promise<TransacaoWithRelations | null>;
  create(data: Prisma.TransacaoUncheckedCreateInput): Promise<TransacaoWithRelations>;
  createMany(data: Prisma.TransacaoUncheckedCreateInput[]): Promise<number>;
  update(id: number, userId: number, data: Prisma.TransacaoUncheckedUpdateInput): Promise<TransacaoWithRelations>;
  delete(id: number, userId: number): Promise<void>;
  deleteByGrupo(compraGrupoId: string, userId: number): Promise<void>;
  deleteFutureByGrupo(compraGrupoId: string, parcelaAtual: number, userId: number): Promise<void>;
  togglePago(id: number, userId: number, newPago: boolean): Promise<boolean>;
  updateManyPago(ids: number[], userId: number, pago: boolean): Promise<number>;
}

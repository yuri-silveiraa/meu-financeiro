import type { GastoFixo, Categoria, Conta, Cartao } from '@prisma/client';

export type GastoFixoWithRelations = GastoFixo & {
  categoria: Categoria | null;
  conta: Conta | null;
  cartao: Cartao | null;
};

export interface CreateGastoFixoData {
  userId: number;
  nome: string;
  valor: number;
  diaVencimento: number;
  tipoPagamento: string | null;
  categoriaId: number | null;
  contaId: number | null;
  cartaoId: number | null;
  totalParcelas: number | null;
  tipo: string;
  dataCriacao: Date;
}

export interface UpdateGastoFixoData {
  nome?: string;
  valor?: number;
  diaVencimento?: number;
  tipoPagamento?: string | null;
  categoriaId?: number | null;
  contaId?: number | null;
  cartaoId?: number | null;
  totalParcelas?: number | null;
  tipo?: string;
}

export interface TransacaoStats {
  count: number;
  maxParcela: number | null;
  maxData: Date | null;
  pagasCount: number;
  naoPagasCount: number;
}

export interface NovaTransacaoLote {
  userId: number;
  data: Date;
  descricao: string;
  valor: number;
  tipo: string;
  tipoPagamento: string;
  categoriaId: number | null;
  contaId: number | null;
  cartaoId: number | null;
  pago: boolean;
  gastoFixoId: number;
  parcelaAtual: number | null;
  totalParcelas: number;
  faturaMes: number | null;
  faturaAno: number | null;
}

export interface IGastosFixosRepository {
  findByUserId(userId: number): Promise<GastoFixoWithRelations[]>;
  findById(id: number, userId: number): Promise<GastoFixoWithRelations | null>;
  findAtivos(userId: number): Promise<GastoFixoWithRelations[]>;
  findAtivosComParcelas(userId: number): Promise<GastoFixoWithRelations[]>;
  getTransacoesStats(gastoFixoId: number, userId: number): Promise<TransacaoStats>;
  existeTransacaoNoMes(gastoFixoId: number, userId: number, ano: number, mes: number, isCartao: boolean): Promise<boolean>;
  deleteTransacoesFuturasNaoPagas(userId: number, ano: number, mes: number): Promise<number>;
  create(data: CreateGastoFixoData): Promise<GastoFixoWithRelations>;
  update(id: number, userId: number, data: UpdateGastoFixoData): Promise<GastoFixoWithRelations>;
  updateTransacoesNaoPagas(gastoFixoId: number, userId: number, data: Partial<NovaTransacaoLote>): Promise<number>;
  deleteTransacoesNaoPagas(gastoFixoId: number, userId: number): Promise<number>;
  createTransacoesLote(transacoes: NovaTransacaoLote[]): Promise<number>;
  removerDuplicatasGastosFixos(userId: number): Promise<number>;
  softDelete(id: number, userId: number): Promise<void>;
}

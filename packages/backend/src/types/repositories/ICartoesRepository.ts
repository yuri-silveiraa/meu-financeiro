import type { Cartao, Conta, Transacao, Categoria } from '@prisma/client';

export type CartaoWithConta = Cartao & {
  contaPadrao: Conta | null;
};

export type TransacaoFatura = Transacao & {
  categoria: Categoria | null;
};

export interface CreateCartaoData {
  userId: number;
  nome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  contaPadraoId: number | null;
  cor: string;
}

export interface UpdateCartaoData {
  nome?: string;
  bandeira?: string;
  limite?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  contaPadraoId?: number | null;
  cor?: string;
}

export interface FaturaGroupedRow {
  faturaAno: number;
  faturaMes: number;
  quantidade: number;
  total: number;
  pago: boolean;
}

export interface ICartoesRepository {
  findByUserId(userId: number): Promise<CartaoWithConta[]>;
  findById(id: number, userId: number): Promise<CartaoWithConta | null>;
  getLimiteComprometido(cartaoId: number, userId: number): Promise<number>;
  getFaturaStats(cartaoId: number, userId: number, ano: number, mes: number): Promise<{ total: number; qtd: number }>;
  create(data: CreateCartaoData): Promise<CartaoWithConta>;
  update(id: number, userId: number, data: UpdateCartaoData): Promise<CartaoWithConta>;
  delete(id: number, userId: number): Promise<void>;
  findFaturasGrouped(cartaoId: number, userId: number): Promise<FaturaGroupedRow[]>;
  findTransacoesFatura(cartaoId: number, userId: number, ano: number, mes: number): Promise<TransacaoFatura[]>;
  pagarFatura(cartaoId: number, userId: number, ano: number, mes: number, contaId: number | null): Promise<number>;
}

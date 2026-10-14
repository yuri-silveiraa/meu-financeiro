export interface ReceitasDespesasSummary {
  receitasTotal: number;
  despesasTotal: number;
  despesasNaoPagasTotal: number;
}

export interface CategoriaAgregada {
  nome: string;
  cor: string;
  total: number;
}

export interface PagamentoAgregado {
  tipo_pagamento: string;
  total: number;
}

export interface FaturasMesAgregada {
  total: number;
  totalPago: number;
  totalAberto: number;
  qtd: number;
  todasPagas: boolean;
}

export interface CartaoLimiteInfo {
  id: number;
  nome: string;
  cor: string | null;
  limite: number;
  comprometido: number;
}

export interface ProjecaoFaturaRow {
  faturaAno: number;
  faturaMes: number;
  cartaoNome: string;
  total: number;
}

export interface CartaoAnualRow {
  faturaMes: number;
  cartaoId: number;
  cartaoNome: string;
  cartaoCor: string | null;
  total: number;
  totalPago: number;
  totalAberto: number;
}

export interface IEstatisticasRepository {
  getReceitasDespesas(userId: number, startDate: Date, endDate: Date, ano: number, mes: number): Promise<ReceitasDespesasSummary>;
  getPorCategoria(userId: number, startDate: Date, endDate: Date, ano: number, mes: number): Promise<CategoriaAgregada[]>;
  getPorPagamento(userId: number, startDate: Date, endDate: Date, ano: number, mes: number): Promise<PagamentoAgregado[]>;
  getFaturasMes(userId: number, ano: number, mes: number): Promise<FaturasMesAgregada>;
  getLimitesCartoes(userId: number): Promise<CartaoLimiteInfo[]>;
  getProjecaoFaturas(userId: number): Promise<ProjecaoFaturaRow[]>;
  getCartoesAnual(userId: number, ano: number): Promise<CartaoAnualRow[]>;
}

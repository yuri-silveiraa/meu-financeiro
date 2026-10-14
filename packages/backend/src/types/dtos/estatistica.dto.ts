export interface CategoriaEstatisticaDTO {
  nome: string;
  cor: string;
  total: number;
}

export interface PagamentoEstatisticaDTO {
  tipo_pagamento: string;
  total: number;
}

export interface FaturasMesEstatisticaDTO {
  total: number;
  totalPagas: number;
  totalAbertas: number;
  qtd: number;
  todasPagas: boolean;
}

export interface LimitesCartoesEstatisticaDTO {
  limiteTotal: number;
  limiteComprometido: number;
  limiteDisponivel: number;
  percentualUsado: number;
  totalCartoes: number;
}

export interface ProjecaoFaturaMesDTO {
  ano: number;
  mes: number;
  label: string;
  total: number;
  [cartaoNome: string]: any;
}

export interface CartaoInfoDTO {
  id: number;
  nome: string;
  cor: string;
}

export interface EstatisticasMensaisResponseDTO {
  receitas: number;
  despesas: number;
  saldo: number;
  saldoProjetado: number;
  despesasNaoPagas: number;
  porCategoria: CategoriaEstatisticaDTO[];
  porPagamento: PagamentoEstatisticaDTO[];
  faturasMes: FaturasMesEstatisticaDTO;
  limitesCartoes: LimitesCartoesEstatisticaDTO;
  projecaoFaturas: ProjecaoFaturaMesDTO[];
  cartoesInfo: CartaoInfoDTO[];
}

export interface DadosMensaisCartaoAnualDTO {
  mes: number;
  nome: string;
  total: number;
  totalPago: number;
  totalAberto: number;
  [cartaoNome: string]: any;
}

export interface CartoesAnualResponseDTO {
  ano: number;
  dadosMensais: DadosMensaisCartaoAnualDTO[];
  cartoes: Array<{ id: number; nome: string; cor: string | null }>;
  totalAno: number;
  totalPagoAno: number;
  totalAbertoAno: number;
}

export interface PrevisaoResponseDTO {
  categoria: string;
  cor: string | null;
  tipo: string;
  media_mensal: number;
}

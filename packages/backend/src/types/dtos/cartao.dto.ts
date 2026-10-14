export interface CreateCartaoDTO {
  nome: string;
  bandeira?: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  conta_padrao_id?: number | null;
  cor?: string;
}

export interface UpdateCartaoDTO {
  nome?: string;
  bandeira?: string;
  limite?: number;
  dia_fechamento?: number;
  dia_vencimento?: number;
  conta_padrao_id?: number | null;
  cor?: string;
}

export interface CartaoResponseDTO {
  id: number;
  user_id: number;
  nome: string;
  bandeira: string | null;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  conta_padrao_id: number | null;
  conta_padrao_nome?: string | null;
  cor: string;
  limite_comprometido?: number;
  limite_disponivel?: number;
  fatura_atual_total?: number;
  fatura_atual_qtd?: number;
}

export interface FaturaResumoDTO {
  fatura_ano: number;
  fatura_mes: number;
  quantidade_transacoes: number;
  total: number;
  pago: boolean;
  data_vencimento: string;
}

export interface FaturaDetalhadaDTO {
  cartao: CartaoResponseDTO;
  fatura_ano: number;
  fatura_mes: number;
  total: number;
  pago: boolean;
  data_vencimento: string;
  transacoes: any[];
}

export interface PagarFaturaDTO {
  conta_id?: number | null;
  data_pagamento?: string;
}

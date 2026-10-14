export interface TransacaoFiltersDTO {
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: number;
  contaId?: number;
  cartaoId?: number;
  faturaMes?: number;
  faturaAno?: number;
  tipo?: string;
  pago?: boolean;
  limit?: number;
}

export interface CreateTransacaoDTO {
  data: string;
  descricao?: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  tipo_pagamento?: 'credito' | 'debito' | 'pix' | 'dinheiro' | 'boleto';
  categoria_id?: number | null;
  conta_id?: number | null;
  cartao_id?: number | null;
  pago?: boolean;
  gasto_fixo_id?: number | null;
  total_parcelas?: number;
}

export interface UpdateTransacaoDTO {
  data?: string;
  descricao?: string;
  valor?: number;
  tipo?: 'receita' | 'despesa';
  tipo_pagamento?: 'credito' | 'debito' | 'pix' | 'dinheiro' | 'boleto';
  categoria_id?: number | null;
  conta_id?: number | null;
  cartao_id?: number | null;
  pago?: boolean;
  gasto_fixo_id?: number | null;
}

export interface TransacaoResponseDTO {
  id: number;
  user_id: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: string;
  tipo_pagamento: string;
  categoria_id: number | null;
  conta_id: number | null;
  cartao_id: number | null;
  pago: boolean;
  gasto_fixo_id: number | null;
  parcela_atual: number | null;
  total_parcelas: number;
  fatura_mes: number | null;
  fatura_ano: number | null;
  compra_grupo_id: string | null;
  categoria_nome: string | null;
  categoria_cor: string | null;
  conta_nome: string | null;
  gasto_fixo_nome: string | null;
  cartao_nome: string | null;
  cartao_bandeira: string | null;
  cartao_cor: string | null;
}

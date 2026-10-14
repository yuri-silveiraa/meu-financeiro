export interface CreateGastoFixoDTO {
  nome: string;
  valor: number;
  dia_vencimento?: number;
  tipo_pagamento?: string;
  categoria_id?: number | null;
  conta_id?: number | null;
  cartao_id?: number | null;
  total_parcelas?: number | null;
  tipo?: string;
}

export interface UpdateGastoFixoDTO {
  nome?: string;
  valor?: number;
  dia_vencimento?: number;
  tipo_pagamento?: string;
  categoria_id?: number | null;
  conta_id?: number | null;
  cartao_id?: number | null;
  total_parcelas?: number | null;
  tipo?: string;
}

export interface GastoFixoResponseDTO {
  id: number;
  user_id: number;
  nome: string;
  valor: number;
  dia_vencimento: number;
  tipo_pagamento: string | null;
  categoria_id: number | null;
  conta_id: number | null;
  cartao_id: number | null;
  total_parcelas: number | null;
  tipo: string;
  ativo: boolean;
  data_criacao: string | null;
  categoria_nome?: string | null;
  categoria_cor?: string | null;
  conta_nome?: string | null;
  cartao_nome?: string | null;
  cartao_cor?: string | null;
  cartao_bandeira?: string | null;
}

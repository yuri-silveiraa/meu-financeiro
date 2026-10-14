export interface CreateContaDTO {
  nome: string;
  banco?: string | null;
  tipo_conta?: string;
  saldo_inicial?: number;
}

export interface UpdateContaDTO {
  nome?: string;
  banco?: string | null;
  tipo_conta?: string;
  saldo_inicial?: number;
}

export interface ContaResponseDTO {
  id: number;
  user_id: number;
  nome: string;
  banco: string | null;
  tipo_conta: string;
  saldo_inicial: number;
}

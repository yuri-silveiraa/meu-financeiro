export interface CreateMetaDTO {
  nome: string;
  valor_meta: number;
  valor_atual?: number;
  prazo?: string | null;
  categoria_id?: number | null;
}

export interface UpdateMetaDTO {
  nome?: string;
  valor_meta?: number;
  valor_atual?: number;
  prazo?: string | null;
  categoria_id?: number | null;
}

export interface MetaResponseDTO {
  id: number;
  user_id: number;
  nome: string;
  valor_meta: number;
  valor_atual: number;
  prazo: string | null;
  categoria_id: number | null;
  categoria_nome: string | null;
}

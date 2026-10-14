export interface CreateCategoriaDTO {
  nome: string;
  cor?: string;
  icone?: string;
}

export interface UpdateCategoriaDTO {
  nome?: string;
  cor?: string;
  icone?: string;
}

export interface CategoriaResponseDTO {
  id: number;
  user_id: number;
  nome: string;
  cor: string;
  icone: string;
}

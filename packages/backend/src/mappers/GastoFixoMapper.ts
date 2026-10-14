import type { GastoFixoWithRelations } from '../types/repositories/IGastosFixosRepository.js';
import type { GastoFixoResponseDTO } from '../types/dtos/gastoFixo.dto.js';

export class GastoFixoMapper {
  static toDTO(gf: GastoFixoWithRelations): GastoFixoResponseDTO {
    return {
      id: gf.id,
      user_id: gf.userId,
      nome: gf.nome,
      valor: Number(gf.valor),
      dia_vencimento: gf.diaVencimento,
      tipo_pagamento: gf.tipoPagamento ?? null,
      categoria_id: gf.categoriaId ?? null,
      conta_id: gf.contaId ?? null,
      cartao_id: gf.cartaoId ?? null,
      total_parcelas: gf.totalParcelas ?? null,
      tipo: gf.tipo ?? 'despesa',
      ativo: Boolean(gf.ativo),
      data_criacao: gf.dataCriacao ? gf.dataCriacao.toISOString().split('T')[0] : null,
      categoria_nome: gf.categoria?.nome ?? null,
      categoria_cor: gf.categoria?.cor ?? null,
      conta_nome: gf.conta?.nome ?? null,
      cartao_nome: gf.cartao?.nome ?? null,
      cartao_cor: gf.cartao?.cor ?? null,
      cartao_bandeira: gf.cartao?.bandeira ?? null,
    };
  }

  static toDTOList(list: GastoFixoWithRelations[]): GastoFixoResponseDTO[] {
    return list.map(GastoFixoMapper.toDTO);
  }
}

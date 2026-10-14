import type { TransacaoWithRelations } from '../types/repositories/ITransacoesRepository.js';
import type { TransacaoResponseDTO } from '../types/dtos/transacao.dto.js';

export class TransacaoMapper {
  static toDTO(t: TransacaoWithRelations): TransacaoResponseDTO {
    const dataStr = t.data instanceof Date ? t.data.toISOString().split('T')[0] : String(t.data);
    const totalParcelasFinal = t.totalParcelas ?? t.gastoFixo?.totalParcelas ?? 1;

    return {
      id: t.id,
      user_id: t.userId,
      data: dataStr,
      descricao: t.descricao ?? '',
      valor: Number(t.valor),
      tipo: t.tipo,
      tipo_pagamento: t.tipoPagamento ?? 'debito',
      categoria_id: t.categoriaId ?? null,
      conta_id: t.contaId ?? null,
      cartao_id: t.cartaoId ?? null,
      pago: Boolean(t.pago),
      gasto_fixo_id: t.gastoFixoId ?? null,
      parcela_atual: t.parcelaAtual ?? null,
      total_parcelas: totalParcelasFinal,
      fatura_mes: t.faturaMes ?? null,
      fatura_ano: t.faturaAno ?? null,
      compra_grupo_id: t.compraGrupoId ?? null,
      categoria_nome: t.categoria?.nome ?? null,
      categoria_cor: t.categoria?.cor ?? null,
      conta_nome: t.conta?.nome ?? null,
      gasto_fixo_nome: t.gastoFixo?.nome ?? null,
      cartao_nome: t.cartao?.nome ?? null,
      cartao_bandeira: t.cartao?.bandeira ?? null,
      cartao_cor: t.cartao?.cor ?? null,
    };
  }

  static toDTOList(list: TransacaoWithRelations[]): TransacaoResponseDTO[] {
    return list.map(TransacaoMapper.toDTO);
  }
}

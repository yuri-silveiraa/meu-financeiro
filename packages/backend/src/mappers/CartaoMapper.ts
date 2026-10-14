import type { CartaoWithConta, TransacaoFatura, FaturaGroupedRow } from '../types/repositories/ICartoesRepository.js';
import type { CartaoResponseDTO, FaturaResumoDTO, FaturaDetalhadaDTO } from '../types/dtos/cartao.dto.js';
import { getProximoDiaUtil } from '../utils/fatura.js';

export class CartaoMapper {
  static toDTO(
    cartao: CartaoWithConta,
    extras?: {
      limiteComprometido?: number;
      faturaAtualTotal?: number;
      faturaAtualQtd?: number;
    }
  ): CartaoResponseDTO {
    const limiteTotal = Number(cartao.limite);
    const limiteComprometido = extras?.limiteComprometido !== undefined ? extras.limiteComprometido : 0;
    const limiteDisponivel = Math.max(0, Math.round((limiteTotal - limiteComprometido) * 100) / 100);

    return {
      id: cartao.id,
      user_id: cartao.userId,
      nome: cartao.nome,
      bandeira: cartao.bandeira ?? 'outro',
      limite: limiteTotal,
      dia_fechamento: cartao.diaFechamento,
      dia_vencimento: cartao.diaVencimento,
      conta_padrao_id: cartao.contaPadraoId ?? null,
      conta_padrao_nome: cartao.contaPadrao?.nome ?? null,
      cor: cartao.cor ?? '#6366f1',
      limite_comprometido: limiteComprometido,
      limite_disponivel: limiteDisponivel,
      fatura_atual_total: extras?.faturaAtualTotal ?? 0,
      fatura_atual_qtd: extras?.faturaAtualQtd ?? 0,
    };
  }

  static toFaturaResumoDTO(row: FaturaGroupedRow, diaVencimento: number): FaturaResumoDTO {
    const ultimoDiaMes = new Date(Date.UTC(row.faturaAno, row.faturaMes, 0)).getUTCDate();
    const diaReal = Math.min(diaVencimento, ultimoDiaMes);
    const dataBase = `${row.faturaAno}-${String(row.faturaMes).padStart(2, '0')}-${String(diaReal).padStart(2, '0')}`;
    const dataVencimento = getProximoDiaUtil(dataBase);

    return {
      fatura_ano: row.faturaAno,
      fatura_mes: row.faturaMes,
      quantidade_transacoes: row.quantidade,
      total: Math.round(row.total * 100) / 100,
      pago: row.pago,
      data_vencimento: dataVencimento,
    };
  }

  static toFaturaDetalhadaDTO(
    cartao: CartaoWithConta,
    ano: number,
    mes: number,
    transacoes: TransacaoFatura[]
  ): FaturaDetalhadaDTO {
    const ultimoDiaMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    const diaReal = Math.min(cartao.diaVencimento, ultimoDiaMes);
    const dataBase = `${ano}-${String(mes).padStart(2, '0')}-${String(diaReal).padStart(2, '0')}`;
    const dataVencimento = getProximoDiaUtil(dataBase);

    const mappedTransacoes = transacoes.map((t) => ({
      id: t.id,
      user_id: t.userId,
      data: t.data instanceof Date ? t.data.toISOString().split('T')[0] : t.data,
      descricao: t.descricao ?? '',
      valor: Number(t.valor),
      tipo: t.tipo,
      tipo_pagamento: t.tipoPagamento ?? 'credito',
      categoria_id: t.categoriaId,
      conta_id: t.contaId,
      cartao_id: t.cartaoId,
      pago: Boolean(t.pago),
      gasto_fixo_id: t.gastoFixoId,
      parcela_atual: t.parcelaAtual,
      total_parcelas: t.totalParcelas ?? 1,
      fatura_mes: t.faturaMes,
      fatura_ano: t.faturaAno,
      compra_grupo_id: t.compraGrupoId,
      categoria_nome: t.categoria?.nome ?? null,
      categoria_cor: t.categoria?.cor ?? null,
      categoria_icone: t.categoria?.icone ?? null,
    }));

    const total = mappedTransacoes.reduce(
      (acc, t) => acc + (t.tipo === 'despesa' ? t.valor : -t.valor),
      0
    );
    const todasPagas = mappedTransacoes.length > 0 && mappedTransacoes.every((t) => t.pago);

    return {
      cartao: CartaoMapper.toDTO(cartao),
      fatura_ano: ano,
      fatura_mes: mes,
      total: Math.round(total * 100) / 100,
      pago: todasPagas,
      data_vencimento: dataVencimento,
      transacoes: mappedTransacoes,
    };
  }
}

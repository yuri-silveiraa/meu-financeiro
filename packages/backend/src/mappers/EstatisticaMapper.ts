import type {
  ReceitasDespesasSummary,
  CategoriaAgregada,
  PagamentoAgregado,
  FaturasMesAgregada,
  CartaoLimiteInfo,
  ProjecaoFaturaRow,
  CartaoAnualRow,
} from '../types/repositories/IEstatisticasRepository.js';
import type {
  EstatisticasMensaisResponseDTO,
  CartoesAnualResponseDTO,
  ProjecaoFaturaMesDTO,
} from '../types/dtos/estatistica.dto.js';

export class EstatisticaMapper {
  static toMensaisDTO(params: {
    summary: ReceitasDespesasSummary;
    porCategoria: CategoriaAgregada[];
    porPagamento: PagamentoAgregado[];
    faturasMes: FaturasMesAgregada;
    cartoesLimites: CartaoLimiteInfo[];
    projecaoFaturasRows: ProjecaoFaturaRow[];
  }): EstatisticasMensaisResponseDTO {
    const { summary, porCategoria, porPagamento, faturasMes, cartoesLimites, projecaoFaturasRows } = params;

    const receitas = Math.round(summary.receitasTotal * 100) / 100;
    const despesas = Math.round(summary.despesasTotal * 100) / 100;
    const despesasNaoPagas = Math.round(summary.despesasNaoPagasTotal * 100) / 100;
    const saldo = Math.round((receitas - despesas) * 100) / 100;
    const saldoProjetado = Math.round((receitas - despesas - despesasNaoPagas) * 100) / 100;

    // Limites dos cartões
    const limiteTotalGeral = cartoesLimites.reduce((sum, c) => sum + c.limite, 0);
    const limiteComprometidoGeral = cartoesLimites.reduce((sum, c) => sum + c.comprometido, 0);
    const limiteDisponivelGeral = Math.max(0, limiteTotalGeral - limiteComprometidoGeral);
    const percentualUsado = limiteTotalGeral > 0
      ? Math.min(100, Math.round((limiteComprometidoGeral / limiteTotalGeral) * 100))
      : 0;

    // Projeção 6 meses
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    const currM = hoje.getMonth() + 1;
    const currA = hoje.getFullYear();

    const projecaoMeses: ProjecaoFaturaMesDTO[] = [];
    for (let i = 0; i < 6; i++) {
      let m = currM + i;
      let a = currA;
      while (m > 12) {
        m -= 12;
        a += 1;
      }
      projecaoMeses.push({
        ano: a,
        mes: m,
        label: `${mesesNomes[m - 1]}/${String(a).slice(2)}`,
        total: 0,
      });
    }

    const projecaoFaturas = projecaoMeses.map((p) => {
      const matchRows = projecaoFaturasRows.filter((r) => r.faturaAno === p.ano && r.faturaMes === p.mes);
      const rowItem: ProjecaoFaturaMesDTO = { ...p };
      matchRows.forEach((r) => {
        rowItem[r.cartaoNome] = r.total;
        rowItem.total = Math.round((rowItem.total + r.total) * 100) / 100;
      });
      return rowItem;
    });

    const cartoesInfo = cartoesLimites.map((c) => ({
      id: c.id,
      nome: c.nome,
      cor: c.cor ?? '#6366f1',
    }));

    return {
      receitas,
      despesas,
      saldo,
      saldoProjetado,
      despesasNaoPagas,
      porCategoria,
      porPagamento,
      faturasMes: {
        total: Math.round(faturasMes.total * 100) / 100,
        totalPagas: Math.round(faturasMes.totalPago * 100) / 100,
        totalAbertas: Math.round(faturasMes.totalAberto * 100) / 100,
        qtd: faturasMes.qtd,
        todasPagas: faturasMes.qtd > 0 ? faturasMes.todasPagas : false,
      },
      limitesCartoes: {
        limiteTotal: Math.round(limiteTotalGeral * 100) / 100,
        limiteComprometido: Math.round(limiteComprometidoGeral * 100) / 100,
        limiteDisponivel: Math.round(limiteDisponivelGeral * 100) / 100,
        percentualUsado,
        totalCartoes: cartoesLimites.length,
      },
      projecaoFaturas,
      cartoesInfo,
    };
  }

  static toCartoesAnualDTO(
    ano: number,
    rows: CartaoAnualRow[],
    cartoes: Array<{ id: number; nome: string; cor: string | null }>
  ): CartoesAnualResponseDTO {
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const dadosMensais = mesesNomes.map((nome, index) => {
      const mesNum = index + 1;
      const rowsDoMes = rows.filter((r) => r.faturaMes === mesNum);
      const total = rowsDoMes.reduce((acc, r) => acc + r.total, 0);
      const totalPago = rowsDoMes.reduce((acc, r) => acc + r.totalPago, 0);
      const totalAberto = rowsDoMes.reduce((acc, r) => acc + r.totalAberto, 0);

      const porCartao: Record<string, number> = {};
      rowsDoMes.forEach((r) => {
        porCartao[r.cartaoNome] = r.total;
      });

      return {
        mes: mesNum,
        nome,
        total: Math.round(total * 100) / 100,
        totalPago: Math.round(totalPago * 100) / 100,
        totalAberto: Math.round(totalAberto * 100) / 100,
        ...porCartao,
      };
    });

    const totalAno = Math.round(dadosMensais.reduce((acc, m) => acc + m.total, 0) * 100) / 100;
    const totalPagoAno = Math.round(dadosMensais.reduce((acc, m) => acc + m.totalPago, 0) * 100) / 100;
    const totalAbertoAno = Math.round(dadosMensais.reduce((acc, m) => acc + m.totalAberto, 0) * 100) / 100;

    return {
      ano,
      dadosMensais,
      cartoes,
      totalAno,
      totalPagoAno,
      totalAbertoAno,
    };
  }
}

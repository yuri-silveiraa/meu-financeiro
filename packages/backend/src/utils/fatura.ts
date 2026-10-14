/**
 * Utilitários para cartões de crédito, cálculo de faturas e vencimento em dias úteis.
 */

function getFeriadosAno(ano: number): Set<string> {
  const fixos = [
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '09-07', // Independência do Brasil
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '11-20', // Dia da Consciência Negra
    '12-25', // Natal
  ];

  const feriados = new Set<string>(fixos.map((f) => `${ano}-${f}`));

  // Cálculo da Páscoa (Algoritmo de Meeus/Jones/Butcher)
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mesPascoa = Math.floor((h + l - 7 * m + 114) / 31);
  const diaPascoa = ((h + l - 7 * m + 114) % 31) + 1;

  const dataPascoa = new Date(Date.UTC(ano, mesPascoa - 1, diaPascoa));

  // Carnaval: terça-feira (-47 dias da Páscoa)
  const dataCarnaval = new Date(dataPascoa);
  dataCarnaval.setUTCDate(dataCarnaval.getUTCDate() - 47);
  feriados.add(dataCarnaval.toISOString().slice(0, 10));

  // Sexta-feira Santa (-2 dias da Páscoa)
  const dataSextaSanta = new Date(dataPascoa);
  dataSextaSanta.setUTCDate(dataSextaSanta.getUTCDate() - 2);
  feriados.add(dataSextaSanta.toISOString().slice(0, 10));

  // Corpus Christi (+60 dias da Páscoa)
  const dataCorpusChristi = new Date(dataPascoa);
  dataCorpusChristi.setUTCDate(dataCorpusChristi.getUTCDate() + 60);
  feriados.add(dataCorpusChristi.toISOString().slice(0, 10));

  return feriados;
}

export function isDiaNaoUtil(dataStr: string): boolean {
  const [anoStr, mesStr, diaStr] = dataStr.split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10);
  const dia = parseInt(diaStr, 10);

  const date = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
  const diaSemana = date.getUTCDay();

  if (diaSemana === 0 || diaSemana === 6) {
    return true;
  }

  const feriados = getFeriadosAno(ano);
  return feriados.has(dataStr);
}

export function getProximoDiaUtil(dataStr: string): string {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const current = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));

  while (true) {
    const formatted = current.toISOString().slice(0, 10);
    if (!isDiaNaoUtil(formatted)) {
      return formatted;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

export interface FaturaVencimentoCalculado {
  fatura_mes: number;
  fatura_ano: number;
  data_vencimento: string;
}

export function calcularFaturaEVencimento(
  dataCompraStr: string,
  diaFechamento: number,
  diaVencimento: number
): FaturaVencimentoCalculado {
  const [anoCompra, mesCompra, diaCompra] = dataCompraStr.split('-').map(Number);

  let faturaMes: number;
  let faturaAno: number;

  if (diaCompra <= diaFechamento) {
    if (diaVencimento <= diaFechamento) {
      faturaMes = mesCompra + 1;
      faturaAno = anoCompra;
    } else {
      faturaMes = mesCompra;
      faturaAno = anoCompra;
    }
  } else {
    if (diaVencimento <= diaFechamento) {
      faturaMes = mesCompra + 2;
      faturaAno = anoCompra;
    } else {
      faturaMes = mesCompra + 1;
      faturaAno = anoCompra;
    }
  }

  while (faturaMes > 12) {
    faturaMes -= 12;
    faturaAno += 1;
  }

  const ultimoDiaMes = new Date(Date.UTC(faturaAno, faturaMes, 0)).getUTCDate();
  const diaRealVencimento = Math.min(diaVencimento, ultimoDiaMes);

  const dataBaseVencimento = `${faturaAno}-${String(faturaMes).padStart(2, '0')}-${String(diaRealVencimento).padStart(2, '0')}`;
  const dataVencimentoAjustada = getProximoDiaUtil(dataBaseVencimento);

  return {
    fatura_mes: faturaMes,
    fatura_ano: faturaAno,
    data_vencimento: dataVencimentoAjustada,
  };
}

export interface GerarParcelasParams {
  dataCompra: string;
  valorTotal: number;
  totalParcelas?: number;
  diaFechamento: number;
  diaVencimento: number;
}

export interface ParcelaCalculada {
  parcela_atual: number;
  total_parcelas: number;
  fatura_mes: number;
  fatura_ano: number;
  data: string;
  valor: number;
}

export function gerarParcelas({
  dataCompra,
  valorTotal,
  totalParcelas = 1,
  diaFechamento,
  diaVencimento,
}: GerarParcelasParams): ParcelaCalculada[] {
  const n = Math.max(1, parseInt(String(totalParcelas), 10) || 1);
  const totalCents = Math.round(valorTotal * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents - baseCents * n;

  const primeira = calcularFaturaEVencimento(dataCompra, diaFechamento, diaVencimento);

  const parcelas: ParcelaCalculada[] = [];

  for (let i = 1; i <= n; i++) {
    const valorParcela = (i === 1 ? baseCents + remainderCents : baseCents) / 100;

    let faturaMes = primeira.fatura_mes + (i - 1);
    let faturaAno = primeira.fatura_ano;

    while (faturaMes > 12) {
      faturaMes -= 12;
      faturaAno += 1;
    }

    const ultimoDiaMes = new Date(Date.UTC(faturaAno, faturaMes, 0)).getUTCDate();
    const diaRealVencimento = Math.min(diaVencimento, ultimoDiaMes);
    const dataBase = `${faturaAno}-${String(faturaMes).padStart(2, '0')}-${String(diaRealVencimento).padStart(2, '0')}`;
    const dataAjustada = getProximoDiaUtil(dataBase);

    parcelas.push({
      parcela_atual: i,
      total_parcelas: n,
      fatura_mes: faturaMes,
      fatura_ano: faturaAno,
      data: dataAjustada,
      valor: valorParcela,
    });
  }

  return parcelas;
}

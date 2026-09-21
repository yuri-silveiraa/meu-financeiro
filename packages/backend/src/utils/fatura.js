/**
 * Utilitários para cartões de crédito, cálculo de faturas e vencimento em dias úteis.
 */

/**
 * Feriados nacionais fixos e móveis no Brasil.
 */
function getFeriadosAno(ano) {
  // Feriados fixos nacionais (MM-DD)
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

  const feriados = new Set(fixos.map(f => `${ano}-${f}`));

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

/**
 * Verifica se uma data é final de semana ou feriado nacional bancário.
 * @param {string} dataStr Formato YYYY-MM-DD
 * @returns {boolean}
 */
export function isDiaNaoUtil(dataStr) {
  const [anoStr, mesStr, diaStr] = dataStr.split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10);
  const dia = parseInt(diaStr, 10);

  const date = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
  const diaSemana = date.getUTCDay(); // 0 = Domingo, 6 = Sábado

  if (diaSemana === 0 || diaSemana === 6) {
    return true;
  }

  const feriados = getFeriadosAno(ano);
  return feriados.has(dataStr);
}

/**
 * Se a data cair em final de semana ou feriado, posterga para o próximo dia útil subsequente.
 * @param {string} dataStr Formato YYYY-MM-DD
 * @returns {string} Formato YYYY-MM-DD
 */
export function getProximoDiaUtil(dataStr) {
  let [ano, mes, dia] = dataStr.split('-').map(Number);
  let current = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));

  while (true) {
    const formatted = current.toISOString().slice(0, 10);
    if (!isDiaNaoUtil(formatted)) {
      return formatted;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

/**
 * Calcula a fatura (mês/ano) e a data de vencimento (ajustada para dia útil) para uma compra.
 * @param {string} dataCompraStr Formato YYYY-MM-DD
 * @param {number} diaFechamento Dia do fechamento da fatura (1 a 31)
 * @param {number} diaVencimento Dia base de vencimento da fatura (1 a 31)
 * @returns {{ fatura_mes: number, fatura_ano: number, data_vencimento: string }}
 */
export function calcularFaturaEVencimento(dataCompraStr, diaFechamento, diaVencimento) {
  const [anoCompra, mesCompra, diaCompra] = dataCompraStr.split('-').map(Number);

  let faturaMes;
  let faturaAno;

  // Se a compra foi até o dia de fechamento:
  if (diaCompra <= diaFechamento) {
    if (diaVencimento <= diaFechamento) {
      // Fecha no mês corrente e vence no próximo mês
      faturaMes = mesCompra + 1;
      faturaAno = anoCompra;
    } else {
      // Fecha no mês corrente e vence no mesmo mês
      faturaMes = mesCompra;
      faturaAno = anoCompra;
    }
  } else {
    // Compra após o fechamento: entra na fatura do ciclo seguinte
    if (diaVencimento <= diaFechamento) {
      // Fecha no mês seguinte e vence em M+2
      faturaMes = mesCompra + 2;
      faturaAno = anoCompra;
    } else {
      // Fecha no mês seguinte e vence em M+1
      faturaMes = mesCompra + 1;
      faturaAno = anoCompra;
    }
  }

  // Normalizar meses > 12
  while (faturaMes > 12) {
    faturaMes -= 12;
    faturaAno += 1;
  }

  // Obter o último dia do mês de vencimento (para evitar 30 de fevereiro, etc.)
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

/**
 * Gera a distribuição de N parcelas com seus valores e datas de vencimento ajustadas.
 * Garante que a soma das parcelas seja exatamente igual ao valor total (ajuste de centavos na 1ª parcela).
 * @param {Object} params
 * @param {string} params.dataCompra Formato YYYY-MM-DD
 * @param {number} params.valorTotal Valor total da compra
 * @param {number} params.totalParcelas Quantidade de parcelas (>= 1)
 * @param {number} params.diaFechamento Dia do fechamento (1 a 31)
 * @param {number} params.diaVencimento Dia do vencimento (1 a 31)
 * @returns {Array<{ parcela_atual: number, total_parcelas: number, fatura_mes: number, fatura_ano: number, data: string, valor: number }>}
 */
export function gerarParcelas({ dataCompra, valorTotal, totalParcelas = 1, diaFechamento, diaVencimento }) {
  const n = Math.max(1, parseInt(totalParcelas, 10) || 1);
  const totalCents = Math.round(valorTotal * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainderCents = totalCents - baseCents * n;

  // Calcula a primeira parcela
  const primeira = calcularFaturaEVencimento(dataCompra, diaFechamento, diaVencimento);

  const parcelas = [];

  for (let i = 1; i <= n; i++) {
    // Os centavos restantes são alocados na primeira parcela
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

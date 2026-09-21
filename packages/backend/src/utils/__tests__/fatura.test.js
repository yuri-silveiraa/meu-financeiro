import { isDiaNaoUtil, getProximoDiaUtil, calcularFaturaEVencimento, gerarParcelas } from '../fatura.js';

describe('fatura utils', () => {
  describe('isDiaNaoUtil', () => {
    it('returns true for Saturday and Sunday', () => {
      expect(isDiaNaoUtil('2026-10-03')).toBe(true); // Sábado
      expect(isDiaNaoUtil('2026-10-04')).toBe(true); // Domingo
    });

    it('returns false for normal business days', () => {
      expect(isDiaNaoUtil('2026-10-06')).toBe(false); // Terça-feira
    });

    it('returns true for national holidays', () => {
      expect(isDiaNaoUtil('2026-12-25')).toBe(true); // Natal
      expect(isDiaNaoUtil('2026-09-07')).toBe(true); // Independência
      expect(isDiaNaoUtil('2026-01-01')).toBe(true); // Confraternização
    });
  });

  describe('getProximoDiaUtil', () => {
    it('leaves normal business day unchanged', () => {
      expect(getProximoDiaUtil('2026-10-06')).toBe('2026-10-06'); // Terça-feira
    });

    it('rolls Saturday to Monday if Monday is a business day', () => {
      // 2026-10-03 is Saturday, 2026-10-05 is Monday
      expect(getProximoDiaUtil('2026-10-03')).toBe('2026-10-05');
    });

    it('rolls Sunday to Monday if Monday is a business day', () => {
      // 2026-10-04 is Sunday, 2026-10-05 is Monday
      expect(getProximoDiaUtil('2026-10-04')).toBe('2026-10-05');
    });

    it('rolls over holiday on Monday to Tuesday', () => {
      // 2026-09-05 is Saturday, 2026-09-06 is Sunday, 2026-09-07 is Holiday (Independência)
      // -> should roll to 2026-09-08 (Tuesday)
      expect(getProximoDiaUtil('2026-09-05')).toBe('2026-09-08');
      expect(getProximoDiaUtil('2026-09-07')).toBe('2026-09-08');
    });
  });

  describe('calcularFaturaEVencimento', () => {
    it('assigns purchase before closing day to current cycle with due day next month', () => {
      // Fechamento 25, Vencimento 5
      // Compra 10/10/2026 -> Vencimento 05/11/2026 (Quinta-feira)
      const res = calcularFaturaEVencimento('2026-10-10', 25, 5);
      expect(res.fatura_mes).toBe(11);
      expect(res.fatura_ano).toBe(2026);
      expect(res.data_vencimento).toBe('2026-11-05');
    });

    it('assigns purchase after closing day to next cycle', () => {
      // Fechamento 25, Vencimento 5
      // Compra 26/10/2026 -> Vencimento 05/12/2026 (Sábado) -> Ajustado para Segunda 07/12/2026!
      const res = calcularFaturaEVencimento('2026-10-26', 25, 5);
      expect(res.fatura_mes).toBe(12);
      expect(res.fatura_ano).toBe(2026);
      expect(res.data_vencimento).toBe('2026-12-07');
    });

    it('handles year crossover in December', () => {
      // Compra 28/12/2026 com fechamento 25 e vencimento 5 -> Fatura de Fevereiro/2027
      const res = calcularFaturaEVencimento('2026-12-28', 25, 5);
      expect(res.fatura_mes).toBe(2);
      expect(res.fatura_ano).toBe(2027);
    });

    it('adjusts for month length (e.g. day 31 in February)', () => {
      // Compra em fevereiro, fechamento 20, vencimento 31 (fevereiro só tem 28 dias)
      // Vencimento no mesmo mês: 2026-02-28 é sábado -> ajustado para segunda 2026-03-02
      const res = calcularFaturaEVencimento('2026-02-10', 20, 31);
      expect(res.fatura_mes).toBe(2);
      expect(res.data_vencimento).toBe('2026-03-02');
    });
  });

  describe('gerarParcelas', () => {
    it('distributes installments correctly with cent balancing on first installment', () => {
      const parcelas = gerarParcelas({
        dataCompra: '2026-05-10',
        valorTotal: 100.00,
        totalParcelas: 3,
        diaFechamento: 25,
        diaVencimento: 10,
      });

      expect(parcelas).toHaveLength(3);
      expect(parcelas[0].valor).toBe(33.34);
      expect(parcelas[1].valor).toBe(33.33);
      expect(parcelas[2].valor).toBe(33.33);

      const totalSoma = parcelas.reduce((acc, p) => acc + p.valor, 0);
      expect(Math.round(totalSoma * 100) / 100).toBe(100.00);

      expect(parcelas[0].parcela_atual).toBe(1);
      expect(parcelas[0].total_parcelas).toBe(3);
      expect(parcelas[0].fatura_mes).toBe(6);
      expect(parcelas[0].fatura_ano).toBe(2026);

      expect(parcelas[1].parcela_atual).toBe(2);
      expect(parcelas[1].fatura_mes).toBe(7);

      expect(parcelas[2].parcela_atual).toBe(3);
      expect(parcelas[2].fatura_mes).toBe(8);
    });
  });
});

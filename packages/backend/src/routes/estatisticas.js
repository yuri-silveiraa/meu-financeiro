import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { sincronizarParcelasGastosFixos } from './gastosFixos.js';

const router = Router();
router.use(authMiddleware);

// Estatísticas mensais
router.get('/', async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);
    if (!mesNum || !anoNum || mesNum < 1 || mesNum > 12 || anoNum < 2000) {
      return res.status(400).json({ error: 'Mês e ano são obrigatórios (mês 1-12, ano >= 2000)' });
    }

    await sincronizarParcelasGastosFixos(req.userId);

    const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
    const lastDay = new Date(anoNum, mesNum, 0).getDate();
    const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Receitas
    const receitasResult = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = $1 AND tipo = $2 AND data >= $3 AND data <= $4',
      [req.userId, 'receita', startDate, endDate]
    );

    // Despesas do mês unificadas:
    // 1) Despesas em conta (pix, débito, boleto, dinheiro) entre startDate e endDate
    // 2) Despesas no cartão cuja fatura vence neste mês (fatura_ano = anoNum AND fatura_mes = mesNum)
    const despesasResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total 
       FROM transacoes 
       WHERE user_id = $1 AND tipo = 'despesa'
         AND (
           (cartao_id IS NULL AND data >= $2 AND data <= $3)
           OR (cartao_id IS NOT NULL AND fatura_ano = $4 AND fatura_mes = $5)
         )`,
      [req.userId, startDate, endDate, anoNum, mesNum]
    );

    // Despesas não pagas
    const despesasNaoPagasResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total 
       FROM transacoes 
       WHERE user_id = $1 AND tipo = 'despesa' AND pago = FALSE
         AND (
           (cartao_id IS NULL AND data >= $2 AND data <= $3)
           OR (cartao_id IS NOT NULL AND fatura_ano = $4 AND fatura_mes = $5)
         )`,
      [req.userId, startDate, endDate, anoNum, mesNum]
    );

    // Por categoria
    const porCategoriaResult = await pool.query(
      `SELECT c.nome, c.cor, SUM(t.valor) as total
       FROM transacoes t
       JOIN categorias c ON t.categoria_id = c.id
       WHERE t.user_id = $1 AND t.tipo = 'despesa'
         AND (
           (t.cartao_id IS NULL AND t.data >= $2 AND t.data <= $3)
           OR (t.cartao_id IS NOT NULL AND t.fatura_ano = $4 AND t.fatura_mes = $5)
         )
       GROUP BY c.id, c.nome, c.cor
       ORDER BY total DESC`,
      [req.userId, startDate, endDate, anoNum, mesNum]
    );

    // Por pagamento
    const porPagamentoResult = await pool.query(
      `SELECT tipo_pagamento, SUM(valor) as total
       FROM transacoes
       WHERE user_id = $1 AND tipo = 'despesa'
         AND (
           (cartao_id IS NULL AND data >= $2 AND data <= $3)
           OR (cartao_id IS NOT NULL AND fatura_ano = $4 AND fatura_mes = $5)
         )
       GROUP BY tipo_pagamento`,
      [req.userId, startDate, endDate, anoNum, mesNum]
    );

    // Faturas do mês selecionado
    const faturasMesResult = await pool.query(
      `SELECT 
         COALESCE(SUM(valor), 0) as total,
         COALESCE(SUM(CASE WHEN pago = TRUE THEN valor ELSE 0 END), 0) as total_pago,
         COALESCE(SUM(CASE WHEN pago = FALSE THEN valor ELSE 0 END), 0) as total_aberto,
         COUNT(*) as qtd,
         BOOL_AND(pago) as todas_pagas
       FROM transacoes
       WHERE user_id = $1 AND cartao_id IS NOT NULL AND tipo = 'despesa'
         AND fatura_ano = $2 AND fatura_mes = $3`,
      [req.userId, anoNum, mesNum]
    );

    const fRow = faturasMesResult.rows[0];
    const faturasQtd = parseInt(fRow.qtd, 10);
    const faturasMes = {
      total: parseFloat(fRow.total || 0),
      totalPagas: parseFloat(fRow.total_pago || 0),
      totalAbertas: parseFloat(fRow.total_aberto || 0),
      qtd: faturasQtd,
      todasPagas: faturasQtd > 0 ? Boolean(fRow.todas_pagas) : false,
    };

    // Limites dos cartões
    const cartoesResult = await pool.query(
      `SELECT 
         c.id, c.nome, c.cor, c.limite,
         COALESCE(
           (SELECT SUM(t.valor) 
            FROM transacoes t 
            WHERE t.cartao_id = c.id 
              AND t.user_id = $1 
              AND t.tipo = 'despesa' 
              AND t.pago = FALSE), 0
         ) as comprometido
       FROM cartoes c
       WHERE c.user_id = $1
       ORDER BY c.nome ASC`,
      [req.userId]
    );

    const limiteTotalGeral = cartoesResult.rows.reduce((sum, c) => sum + parseFloat(c.limite || 0), 0);
    const limiteComprometidoGeral = cartoesResult.rows.reduce((sum, c) => sum + parseFloat(c.comprometido || 0), 0);
    const limiteDisponivelGeral = Math.max(0, limiteTotalGeral - limiteComprometidoGeral);
    const percentualUsado = limiteTotalGeral > 0
      ? Math.min(100, Math.round((limiteComprometidoGeral / limiteTotalGeral) * 100))
      : 0;

    const limitesCartoes = {
      limiteTotal: Math.round(limiteTotalGeral * 100) / 100,
      limiteComprometido: Math.round(limiteComprometidoGeral * 100) / 100,
      limiteDisponivel: Math.round(limiteDisponivelGeral * 100) / 100,
      percentualUsado,
      totalCartoes: cartoesResult.rows.length,
    };

    // Projeção de faturas dos próximos 6 meses
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    const currM = hoje.getMonth() + 1;
    const currA = hoje.getFullYear();

    const projecaoMeses = [];
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

    const projecaoFaturasResult = await pool.query(
      `SELECT 
         t.fatura_ano,
         t.fatura_mes,
         c.nome as cartao_nome,
         SUM(t.valor) as total
       FROM transacoes t
       JOIN cartoes c ON t.cartao_id = c.id
       WHERE t.user_id = $1 AND t.tipo = 'despesa'
         AND t.fatura_ano IS NOT NULL AND t.fatura_mes IS NOT NULL
       GROUP BY t.fatura_ano, t.fatura_mes, c.nome`,
      [req.userId]
    );

    const projecaoFaturas = projecaoMeses.map((p) => {
      const matchRows = projecaoFaturasResult.rows.filter(
        (r) => parseInt(r.fatura_ano, 10) === p.ano && parseInt(r.fatura_mes, 10) === p.mes
      );
      const rowItem = { ...p };
      matchRows.forEach((r) => {
        const val = parseFloat(r.total || 0);
        rowItem[r.cartao_nome] = val;
        rowItem.total = Math.round((rowItem.total + val) * 100) / 100;
      });
      return rowItem;
    });

    const cartoesInfo = cartoesResult.rows.map((c) => ({
      id: c.id,
      nome: c.nome,
      cor: c.cor || '#6366f1',
    }));

    const receitas = parseFloat(receitasResult.rows[0].total);
    const despesas = parseFloat(despesasResult.rows[0].total);
    const despesasNaoPagas = parseFloat(despesasNaoPagasResult.rows[0].total);

    res.json({
      receitas,
      despesas,
      saldo: Math.round((receitas - despesas) * 100) / 100,
      saldoProjetado: Math.round((receitas - despesas - despesasNaoPagas) * 100) / 100,
      despesasNaoPagas,
      porCategoria: porCategoriaResult.rows.map((r) => ({
        nome: r.nome,
        cor: r.cor,
        total: parseFloat(r.total),
      })),
      porPagamento: porPagamentoResult.rows
        .filter((r) => r.tipo_pagamento)
        .map((r) => ({
          tipo_pagamento: r.tipo_pagamento,
          total: parseFloat(r.total),
        })),
      faturasMes,
      limitesCartoes,
      projecaoFaturas,
      cartoesInfo,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório anual de faturas de cartões
router.get('/cartoes-anual', async (req, res) => {
  try {
    const { ano } = req.query;
    const anoNum = parseInt(ano, 10) || new Date().getFullYear();

    await sincronizarParcelasGastosFixos(req.userId);

    const faturasResult = await pool.query(
      `SELECT 
         t.fatura_mes,
         c.id as cartao_id,
         c.nome as cartao_nome,
         c.cor as cartao_cor,
         SUM(t.valor) as total,
         SUM(CASE WHEN t.pago = TRUE THEN t.valor ELSE 0 END) as total_pago,
         SUM(CASE WHEN t.pago = FALSE THEN t.valor ELSE 0 END) as total_aberto
       FROM transacoes t
       JOIN cartoes c ON t.cartao_id = c.id
       WHERE t.user_id = $1 AND t.tipo = 'despesa' AND t.fatura_ano = $2
       GROUP BY t.fatura_mes, c.id, c.nome, c.cor
       ORDER BY t.fatura_mes ASC`,
      [req.userId, anoNum]
    );

    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dadosMensais = mesesNomes.map((nome, index) => {
      const mesNum = index + 1;
      const rowsDoMes = faturasResult.rows.filter((r) => parseInt(r.fatura_mes, 10) === mesNum);
      const total = rowsDoMes.reduce((acc, r) => acc + parseFloat(r.total), 0);
      const totalPago = rowsDoMes.reduce((acc, r) => acc + parseFloat(r.total_pago), 0);
      const totalAberto = rowsDoMes.reduce((acc, r) => acc + parseFloat(r.total_aberto), 0);

      const porCartao = {};
      rowsDoMes.forEach((r) => {
        porCartao[r.cartao_nome] = parseFloat(r.total);
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

    const cartoesResult = await pool.query(
      'SELECT id, nome, cor FROM cartoes WHERE user_id = $1 ORDER BY nome ASC',
      [req.userId]
    );

    res.json({
      ano: anoNum,
      dadosMensais,
      cartoes: cartoesResult.rows,
      totalAno: Math.round(dadosMensais.reduce((acc, m) => acc + m.total, 0) * 100) / 100,
      totalPagoAno: Math.round(dadosMensais.reduce((acc, m) => acc + m.totalPago, 0) * 100) / 100,
      totalAbertoAno: Math.round(dadosMensais.reduce((acc, m) => acc + m.totalAberto, 0) * 100) / 100,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas anuais de cartões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

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
    const startDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
    const lastDay = new Date(anoNum, mesNum, 0).getDate();
    const endDate = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Receitas
    const receitasResult = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = $1 AND tipo = $2 AND data >= $3 AND data <= $4',
      [req.userId, 'receita', startDate, endDate]
    );

    // Despesas
    const despesasResult = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = $1 AND tipo = $2 AND data >= $3 AND data <= $4',
      [req.userId, 'despesa', startDate, endDate]
    );

    // Despesas não pagas
    const despesasNaoPagasResult = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = $1 AND tipo = $2 AND pago = FALSE AND data >= $3 AND data <= $4',
      [req.userId, 'despesa', startDate, endDate]
    );

    // Por categoria
    const porCategoriaResult = await pool.query(
      `SELECT c.nome, c.cor, SUM(t.valor) as total
       FROM transacoes t
       JOIN categorias c ON t.categoria_id = c.id
       WHERE t.user_id = $1 AND t.tipo = $2 AND t.data >= $3 AND t.data <= $4
       GROUP BY c.id
       ORDER BY total DESC`,
      [req.userId, 'despesa', startDate, endDate]
    );

    // Por pagamento
    const porPagamentoResult = await pool.query(
      `SELECT tipo_pagamento, SUM(valor) as total
       FROM transacoes
       WHERE user_id = $1 AND tipo = $2 AND data >= $3 AND data <= $4
       GROUP BY tipo_pagamento`,
      [req.userId, 'despesa', startDate, endDate]
    );

    const receitas = parseFloat(receitasResult.rows[0].total);
    const despesas = parseFloat(despesasResult.rows[0].total);
    const despesasNaoPagas = parseFloat(despesasNaoPagasResult.rows[0].total);

    res.json({
      receitas,
      despesas,
      saldo: receitas - despesas,
      saldoProjetado: receitas - despesas - despesasNaoPagas,
      despesasNaoPagas,
      porCategoria: porCategoriaResult.rows.map(r => ({
        nome: r.nome,
        cor: r.cor,
        total: parseFloat(r.total)
      })),
      porPagamento: porPagamentoResult.rows
        .filter(r => r.tipo_pagamento)
        .map(r => ({
          tipo_pagamento: r.tipo_pagamento,
          total: parseFloat(r.total)
        })),
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

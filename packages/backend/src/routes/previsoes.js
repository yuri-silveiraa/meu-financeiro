import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Previsões de gastos fixos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT gf.nome as categoria, gf.cor as cor, gf.tipo, gf.valor as media_mensal
       FROM (
         SELECT gf_inner.nome, c.cor, gf_inner.tipo, gf_inner.valor,
                ROW_NUMBER() OVER (PARTITION BY gf_inner.categoria_id ORDER BY gf_inner.id DESC) as rn
         FROM gastos_fixos gf_inner
         LEFT JOIN categorias c ON gf_inner.categoria_id = c.id
         WHERE gf_inner.user_id = $1 AND gf_inner.ativo = TRUE
       ) gf
       WHERE gf.rn = 1
       ORDER BY gf.tipo, gf.media_mensal DESC`,
      [req.userId]
    );
    res.json(result.rows.map(r => ({
      categoria: r.categoria,
      cor: r.cor,
      tipo: r.tipo || 'despesa',
      media_mensal: parseFloat(r.media_mensal)
    })));
  } catch (error) {
    console.error('Erro ao buscar previsões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

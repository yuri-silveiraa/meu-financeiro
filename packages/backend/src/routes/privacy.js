import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = Router();
router.use(authMiddleware);

// GET /api/privacy/my-data — Direito de acesso (Art. 18, II LGPD)
router.get('/my-data', async (req, res) => {
  try {
    const userId = req.userId;

    const [user, transacoes, categorias, contas, cartoes, metas, gastosFixos] = await Promise.all([
      pool.query('SELECT id, email, name, avatar_url, whatsapp_number, created_at, consent_accepted_at FROM users WHERE id = $1', [userId]),
      pool.query('SELECT id, data, descricao, valor, tipo, tipo_pagamento, pago FROM transacoes WHERE user_id = $1 ORDER BY data DESC', [userId]),
      pool.query('SELECT id, nome, cor FROM categorias WHERE user_id = $1', [userId]),
      pool.query('SELECT id, nome, banco, tipo_conta, saldo_inicial FROM contas WHERE user_id = $1', [userId]),
      pool.query('SELECT id, nome, bandeira, limite, dia_fechamento, dia_vencimento FROM cartoes WHERE user_id = $1', [userId]),
      pool.query('SELECT id, nome, valor_meta, valor_atual, prazo FROM metas WHERE user_id = $1', [userId]),
      pool.query('SELECT id, nome, valor, dia_vencimento, tipo_pagamento, tipo FROM gastos_fixos WHERE user_id = $1', [userId]),
    ]);

    res.json({
      exportadoEm: new Date().toISOString(),
      usuario: user.rows[0] || null,
      transacoes: transacoes.rows,
      categorias: categorias.rows,
      contas: contas.rows,
      cartoes: cartoes.rows,
      metas: metas.rows,
      gastosFixos: gastosFixos.rows,
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({ error: 'Erro ao exportar dados pessoais' });
  }
});

// DELETE /api/privacy/delete-account — Direito de eliminação (Art. 18, VI LGPD)
router.delete('/delete-account', async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Conta e todos os dados pessoais foram excluídos permanentemente.' });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
});

export default router;

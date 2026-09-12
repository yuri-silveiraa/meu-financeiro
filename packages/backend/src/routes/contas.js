import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateString, validateNumber } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

// Listar contas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contas WHERE user_id = $1 ORDER BY nome',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar conta
router.post('/', async (req, res) => {
  try {
    const { nome, banco, tipo_conta, saldo_inicial } = req.body;
    const error = validateString(nome, 'Nome', { max: 100 });
    if (error) return res.status(400).json({ error });

    const result = await pool.query(
      'INSERT INTO contas (user_id, nome, banco, tipo_conta, saldo_inicial) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, nome, banco || null, tipo_conta || 'corrente', saldo_inicial || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar conta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, banco, tipo_conta, saldo_inicial } = req.body;
    const error = validateString(nome, 'Nome', { max: 100 });
    if (error) return res.status(400).json({ error });

    const result = await pool.query(
      'UPDATE contas SET nome = $1, banco = $2, tipo_conta = $3, saldo_inicial = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [nome, banco, tipo_conta, saldo_inicial, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar conta
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query('UPDATE transacoes SET conta_id = NULL WHERE conta_id = $1 AND user_id = $2', [id, req.userId]);
    await client.query('UPDATE gastos_fixos SET conta_id = NULL WHERE conta_id = $1 AND user_id = $2', [id, req.userId]);
    const result = await client.query(
      'DELETE FROM contas WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Conta não encontrada' });
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

export default router;

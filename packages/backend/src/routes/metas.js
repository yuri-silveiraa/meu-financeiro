import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateString, validateNumber } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

// Listar metas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, c.nome as categoria_nome
       FROM metas m
       LEFT JOIN categorias c ON m.categoria_id = c.id
       WHERE m.user_id = $1
       ORDER BY m.prazo`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar meta
router.post('/', async (req, res) => {
  try {
    const { nome, valor_meta, valor_atual, prazo, categoria_id } = req.body;
    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(valor_meta, 'Valor da meta', { min: 0.01 }),
    ].filter(Boolean);
    if (errors.length > 0) return res.status(400).json({ error: errors[0] });

    const result = await pool.query(
      'INSERT INTO metas (user_id, nome, valor_meta, valor_atual, prazo, categoria_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.userId, nome, valor_meta, valor_atual || 0, prazo || null, categoria_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar meta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor_meta, valor_atual, prazo, categoria_id } = req.body;
    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(valor_meta, 'Valor da meta', { min: 0.01 }),
    ].filter(Boolean);
    if (errors.length > 0) return res.status(400).json({ error: errors[0] });

    const result = await pool.query(
      'UPDATE metas SET nome = $1, valor_meta = $2, valor_atual = $3, prazo = $4, categoria_id = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [nome, valor_meta, valor_atual, prazo || null, categoria_id || null, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

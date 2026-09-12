import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateString } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

// Listar categorias
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categorias WHERE user_id = $1 ORDER BY nome',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar categoria
router.post('/', async (req, res) => {
  try {
    const { nome, cor, icone } = req.body;
    const error = validateString(nome, 'Nome', { max: 100 });
    if (error) return res.status(400).json({ error });

    const result = await pool.query(
      'INSERT INTO categorias (user_id, nome, cor, icone) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, nome, cor || '#6366f1', icone || 'folder']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar categoria
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cor, icone } = req.body;
    const error = validateString(nome, 'Nome', { max: 100 });
    if (error) return res.status(400).json({ error });

    const result = await pool.query(
      'UPDATE categorias SET nome = $1, cor = $2, icone = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [nome, cor, icone, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar categoria
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query('UPDATE transacoes SET categoria_id = NULL WHERE categoria_id = $1 AND user_id = $2', [id, req.userId]);
    await client.query('UPDATE metas SET categoria_id = NULL WHERE categoria_id = $1 AND user_id = $2', [id, req.userId]);
    await client.query('UPDATE gastos_fixos SET categoria_id = NULL WHERE categoria_id = $1 AND user_id = $2', [id, req.userId]);
    const result = await client.query(
      'DELETE FROM categorias WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

export default router;

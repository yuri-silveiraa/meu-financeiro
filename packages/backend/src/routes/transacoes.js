import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateDate, validateNumber, validateEnum } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

// Listar transações
router.get('/', async (req, res) => {
  try {
    const { dataInicio, dataFim, categoriaId, contaId, tipo, pago } = req.query;
    let query = `
      SELECT t.*, c.nome as categoria_nome, c.cor as categoria_cor,
             ct.nome as conta_nome, gf.nome as gasto_fixo_nome,
             t.parcela_atual, gf.total_parcelas
      FROM transacoes t
      LEFT JOIN categorias c ON t.categoria_id = c.id
      LEFT JOIN contas ct ON t.conta_id = ct.id
      LEFT JOIN gastos_fixos gf ON t.gasto_fixo_id = gf.id
      WHERE t.user_id = $1
    `;
    const params = [req.userId];
    let paramIndex = 2;

    if (dataInicio) {
      query += ` AND t.data >= $${paramIndex++}`;
      params.push(dataInicio);
    }
    if (dataFim) {
      query += ` AND t.data <= $${paramIndex++}`;
      params.push(dataFim);
    }
    if (categoriaId) {
      query += ` AND t.categoria_id = $${paramIndex++}`;
      params.push(categoriaId);
    }
    if (contaId) {
      query += ` AND t.conta_id = $${paramIndex++}`;
      params.push(contaId);
    }
    if (tipo) {
      query += ` AND t.tipo = $${paramIndex++}`;
      params.push(tipo);
    }
    if (pago !== undefined && pago !== '') {
      query += ` AND t.pago = $${paramIndex++}`;
      params.push(pago === '1' || pago === 'true');
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 1000);
    query += ` ORDER BY t.data DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar transação
router.post('/', async (req, res) => {
  try {
    const { data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago, gasto_fixo_id } = req.body;

    const errors = [
      validateDate(data, 'Data'),
      validateNumber(valor, 'Valor', { min: 0.01 }),
      validateEnum(tipo, 'Tipo', ['receita', 'despesa']),
      validateEnum(tipo_pagamento, 'Tipo de pagamento', ['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
    ].filter(Boolean);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const result = await pool.query(
      `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago, gasto_fixo_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.userId, data, descricao || null, valor, tipo, tipo_pagamento || null, categoria_id || null, conta_id || null, pago || false, gasto_fixo_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar transação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago, gasto_fixo_id } = req.body;

    const errors = [
      validateDate(data, 'Data'),
      validateNumber(valor, 'Valor', { min: 0.01 }),
      validateEnum(tipo, 'Tipo', ['receita', 'despesa']),
      validateEnum(tipo_pagamento, 'Tipo de pagamento', ['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
    ].filter(Boolean);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const result = await pool.query(
      `UPDATE transacoes SET data = $1, descricao = $2, valor = $3, tipo = $4, tipo_pagamento = $5,
       categoria_id = $6, conta_id = $7, pago = $8, gasto_fixo_id = $9
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [data, descricao || null, valor, tipo, tipo_pagamento || null, categoria_id || null, conta_id || null, pago || false, gasto_fixo_id || null, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar transação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM transacoes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Toggle pago
router.patch('/:id/pago', async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query(
      'SELECT pago FROM transacoes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    const newPago = !current.rows[0].pago;
    const result = await pool.query(
      'UPDATE transacoes SET pago = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [newPago, id, req.userId]
    );
    res.json({ success: true, pago: result.rows[0].pago });
  } catch (error) {
    console.error('Erro ao toggle pago:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

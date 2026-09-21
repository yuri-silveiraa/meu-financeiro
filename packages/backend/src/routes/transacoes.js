import { Router } from 'express';
import { randomUUID } from 'crypto';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateDate, validateNumber, validateEnum } from '../middleware/validate.js';
import { calcularFaturaEVencimento, gerarParcelas } from '../utils/fatura.js';

const router = Router();
router.use(authMiddleware);

// Listar transações
router.get('/', async (req, res) => {
  try {
    const { dataInicio, dataFim, categoriaId, contaId, cartaoId, faturaMes, faturaAno, tipo, pago } = req.query;
    let query = `
      SELECT t.*, c.nome as categoria_nome, c.cor as categoria_cor,
             ct.nome as conta_nome, gf.nome as gasto_fixo_nome,
             cr.nome as cartao_nome, cr.bandeira as cartao_bandeira, cr.cor as cartao_cor,
             t.parcela_atual, COALESCE(t.total_parcelas, gf.total_parcelas, 1) as total_parcelas
      FROM transacoes t
      LEFT JOIN categorias c ON t.categoria_id = c.id
      LEFT JOIN contas ct ON t.conta_id = ct.id
      LEFT JOIN gastos_fixos gf ON t.gasto_fixo_id = gf.id
      LEFT JOIN cartoes cr ON t.cartao_id = cr.id
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
    if (cartaoId) {
      query += ` AND t.cartao_id = $${paramIndex++}`;
      params.push(cartaoId);
    }
    if (faturaMes) {
      query += ` AND t.fatura_mes = $${paramIndex++}`;
      params.push(parseInt(faturaMes, 10));
    }
    if (faturaAno) {
      query += ` AND t.fatura_ano = $${paramIndex++}`;
      params.push(parseInt(faturaAno, 10));
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
  const client = await pool.connect();
  try {
    const {
      data, descricao, valor, tipo, tipo_pagamento,
      categoria_id, conta_id, cartao_id, pago,
      gasto_fixo_id, total_parcelas
    } = req.body;

    const errors = [
      validateDate(data, 'Data'),
      validateNumber(valor, 'Valor', { min: 0.01 }),
      validateEnum(tipo, 'Tipo', ['receita', 'despesa']),
      validateEnum(tipo_pagamento, 'Tipo de pagamento', ['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
    ].filter(Boolean);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    // Se for compra com cartão de crédito
    if (tipo_pagamento === 'credito' && cartao_id) {
      const cartaoRes = await client.query(
        'SELECT * FROM cartoes WHERE id = $1 AND user_id = $2',
        [cartao_id, req.userId]
      );
      if (cartaoRes.rows.length === 0) {
        return res.status(404).json({ error: 'Cartão não encontrado' });
      }
      const cartao = cartaoRes.rows[0];
      const parcelasCount = parseInt(total_parcelas, 10) || 1;

      if (parcelasCount > 1) {
        const parcelas = gerarParcelas({
          dataCompra: data,
          valorTotal: parseFloat(valor),
          totalParcelas: parcelasCount,
          diaFechamento: cartao.dia_fechamento,
          diaVencimento: cartao.dia_vencimento,
        });

        const grupoId = randomUUID();
        const criadas = [];

        await client.query('BEGIN');
        for (const p of parcelas) {
          const descParcela = descricao ? `${descricao} (${p.parcela_atual}/${p.total_parcelas})` : `Compra (${p.parcela_atual}/${p.total_parcelas})`;
          const r = await client.query(
            `INSERT INTO transacoes (
               user_id, data, descricao, valor, tipo, tipo_pagamento,
               categoria_id, conta_id, cartao_id, pago, gasto_fixo_id,
               parcela_atual, total_parcelas, fatura_mes, fatura_ano, compra_grupo_id
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [
              req.userId, p.data, descParcela, p.valor, tipo, 'credito',
              categoria_id || null, conta_id || null, cartao_id, pago || false,
              gasto_fixo_id || null, p.parcela_atual, p.total_parcelas,
              p.fatura_mes, p.fatura_ano, grupoId
            ]
          );
          criadas.push(r.rows[0]);
        }
        await client.query('COMMIT');
        return res.status(201).json(criadas[0]);
      } else {
        // Compra em 1x no cartão
        const faturaInfo = calcularFaturaEVencimento(data, cartao.dia_fechamento, cartao.dia_vencimento);
        const result = await client.query(
          `INSERT INTO transacoes (
             user_id, data, descricao, valor, tipo, tipo_pagamento,
             categoria_id, conta_id, cartao_id, pago, gasto_fixo_id,
             parcela_atual, total_parcelas, fatura_mes, fatura_ano
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
          [
            req.userId, faturaInfo.data_vencimento, descricao || null, valor, tipo, 'credito',
            categoria_id || null, conta_id || null, cartao_id, pago || false,
            gasto_fixo_id || null, 1, 1, faturaInfo.fatura_mes, faturaInfo.fatura_ano
          ]
        );
        return res.status(201).json(result.rows[0]);
      }
    }

    // Transação padrão
    const result = await client.query(
      `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago, gasto_fixo_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.userId, data, descricao || null, valor, tipo, tipo_pagamento || null, categoria_id || null, conta_id || null, pago || false, gasto_fixo_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Atualizar transação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, cartao_id, pago, gasto_fixo_id } = req.body;

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
       categoria_id = $6, conta_id = $7, cartao_id = $8, pago = $9, gasto_fixo_id = $10
       WHERE id = $11 AND user_id = $12 RETURNING *`,
      [data, descricao || null, valor, tipo, tipo_pagamento || null, categoria_id || null, conta_id || null, cartao_id || null, pago || false, gasto_fixo_id || null, id, req.userId]
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
    const { mode } = req.query; // 'single' (padrão), 'future', 'all'

    // Verifica se faz parte de compra_grupo_id
    const current = await pool.query(
      'SELECT id, compra_grupo_id, parcela_atual FROM transacoes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const { compra_grupo_id, parcela_atual } = current.rows[0];

    if (compra_grupo_id && mode === 'all') {
      await pool.query(
        'DELETE FROM transacoes WHERE compra_grupo_id = $1 AND user_id = $2',
        [compra_grupo_id, req.userId]
      );
    } else if (compra_grupo_id && mode === 'future') {
      await pool.query(
        'DELETE FROM transacoes WHERE compra_grupo_id = $1 AND parcela_atual >= $2 AND user_id = $3',
        [compra_grupo_id, parcela_atual, req.userId]
      );
    } else {
      await pool.query(
        'DELETE FROM transacoes WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );
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

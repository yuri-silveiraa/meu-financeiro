import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateString, validateNumber, validateInteger, validateEnum } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Listar gastos fixos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT gf.*, c.nome as categoria_nome, c.cor as categoria_cor, ct.nome as conta_nome
       FROM gastos_fixos gf
       LEFT JOIN categorias c ON gf.categoria_id = c.id
       LEFT JOIN contas ct ON gf.conta_id = ct.id
       WHERE gf.user_id = $1 AND gf.ativo = TRUE
       ORDER BY gf.dia_vencimento`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar gastos fixos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar gasto fixo
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nome, valor, dia_vencimento, tipo_pagamento, categoria_id, conta_id, total_parcelas, tipo } = req.body;
    const tipoFinal = tipo || 'despesa';

    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(valor, 'Valor', { min: 0.01 }),
      validateInteger(dia_vencimento, 'Dia de vencimento', { min: 1, max: 31 }),
      validateEnum(tipo_pagamento, 'Tipo de pagamento', ['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
      validateEnum(tipo, 'Tipo', ['receita', 'despesa']),
    ].filter(Boolean);
    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: errors[0] });
    }

    const result = await client.query(
      `INSERT INTO gastos_fixos (user_id, nome, valor, dia_vencimento, tipo_pagamento, categoria_id, conta_id, total_parcelas, tipo, data_criacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE) RETURNING *`,
      [req.userId, nome, valor, dia_vencimento, tipo_pagamento || null, categoria_id || null, conta_id || null, total_parcelas || null, tipoFinal]
    );

    const gastoFixo = result.rows[0];
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    let parcelaAtual = 1;
    let transacoesCriadas = 0;

    for (let m = mes; m <= 12; m++) {
      if (total_parcelas && parcelaAtual > total_parcelas) break;

      const effectiveDay = Math.min(dia_vencimento, lastDayOfMonth(ano, m));
      const dataTransacao = `${ano}-${String(m).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
      await client.query(
        `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago, gasto_fixo_id, parcela_atual)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9, $10)`,
        [req.userId, dataTransacao, nome, valor, tipoFinal, tipo_pagamento || 'pix', categoria_id || null, conta_id || null, gastoFixo.id, total_parcelas ? parcelaAtual : null]
      );
      parcelaAtual++;
      transacoesCriadas++;
    }

    await client.query('COMMIT');
    res.status(201).json({ ...gastoFixo, transacoesCriadas });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar gasto fixo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Atualizar gasto fixo
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { nome, valor, dia_vencimento, tipo_pagamento, categoria_id, conta_id, total_parcelas, tipo } = req.body;
    const tipoFinal = tipo || 'despesa';

    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(valor, 'Valor', { min: 0.01 }),
      validateInteger(dia_vencimento, 'Dia de vencimento', { min: 1, max: 31 }),
      validateEnum(tipo_pagamento, 'Tipo de pagamento', ['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
      validateEnum(tipo, 'Tipo', ['receita', 'despesa']),
    ].filter(Boolean);
    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: errors[0] });
    }

    const result = await client.query(
      `UPDATE gastos_fixos SET nome = $1, valor = $2, dia_vencimento = $3, tipo_pagamento = $4,
       categoria_id = $5, conta_id = $6, total_parcelas = $7, tipo = $8
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [nome, valor, dia_vencimento, tipo_pagamento || null, categoria_id || null, conta_id || null, total_parcelas || null, tipoFinal, id, req.userId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }

    // Atualizar transações não pagas vinculadas
    await client.query(
      `UPDATE transacoes SET valor = $1, descricao = $2, tipo = $3, tipo_pagamento = $4,
       categoria_id = $5, conta_id = $6
       WHERE gasto_fixo_id = $7 AND user_id = $8 AND pago = FALSE`,
      [valor, nome, tipoFinal, tipo_pagamento || 'pix', categoria_id || null, conta_id || null, id, req.userId]
    );

    // Completar parcelas faltantes
    if (total_parcelas) {
      const pagasResult = await client.query(
        'SELECT COUNT(*) FROM transacoes WHERE gasto_fixo_id = $1 AND user_id = $2 AND pago = TRUE',
        [id, req.userId]
      );
      const pagas = parseInt(pagasResult.rows[0].count);

      const naoPagasResult = await client.query(
        'SELECT COUNT(*) FROM transacoes WHERE gasto_fixo_id = $1 AND user_id = $2 AND pago = FALSE',
        [id, req.userId]
      );
      const naoPagas = parseInt(naoPagasResult.rows[0].count);

      const faltam = total_parcelas - pagas - naoPagas;

      if (faltam > 0) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        let parcelaBase = pagas + 1;

        const ultimaParcelaResult = await client.query(
          'SELECT MAX(parcela_atual) as max_parcela FROM transacoes WHERE gasto_fixo_id = $1 AND user_id = $2 AND pago = TRUE AND parcela_atual IS NOT NULL',
          [id, req.userId]
        );
        if (ultimaParcelaResult.rows[0].max_parcela) {
          parcelaBase = ultimaParcelaResult.rows[0].max_parcela + 1;
        }

        let criadas = 0;
        for (let m = hoje.getMonth() + 1; m <= 12; m++) {
          if (criadas >= faltam) break;

          const effectiveDay = Math.min(dia_vencimento, lastDayOfMonth(ano, m));
          const dataTransacao = `${ano}-${String(m).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
          const existeResult = await client.query(
            'SELECT id FROM transacoes WHERE gasto_fixo_id = $1 AND user_id = $2 AND data = $3',
            [id, req.userId, dataTransacao]
          );

          if (existeResult.rows.length === 0) {
            await client.query(
              `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago, gasto_fixo_id, parcela_atual)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9, $10)`,
              [req.userId, dataTransacao, nome, valor, tipoFinal, tipo_pagamento || 'pix', categoria_id || null, conta_id || null, id, parcelaBase + criadas]
            );
            criadas++;
          }
        }
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar gasto fixo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Deletar gasto fixo (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE gastos_fixos SET ativo = FALSE WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar gasto fixo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

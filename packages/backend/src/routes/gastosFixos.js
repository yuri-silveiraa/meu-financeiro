import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateString, validateNumber, validateInteger, validateEnum } from '../middleware/validate.js';

const router = Router();
router.use(authMiddleware);

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Sincroniza e completa parcelas faltantes de gastos fixos (ex: parcelas de anos futuros que ainda não foram criadas).
 */
export async function sincronizarParcelasGastosFixos(userId) {
  if (!userId) return;
  const client = await pool.connect();
  try {
    const gfResult = await client.query(
      `SELECT gf.*, cr.dia_vencimento as cartao_vencimento
       FROM gastos_fixos gf
       LEFT JOIN cartoes cr ON gf.cartao_id = cr.id
       WHERE gf.user_id = $1 AND gf.ativo = TRUE AND gf.total_parcelas IS NOT NULL`,
      [userId]
    );

    for (const gf of gfResult.rows) {
      const txResult = await client.query(
        `SELECT COUNT(*) as count, MAX(parcela_atual) as max_parcela, MAX(data) as max_data
         FROM transacoes
         WHERE gasto_fixo_id = $1 AND user_id = $2`,
        [gf.id, userId]
      );

      const criadas = parseInt(txResult.rows[0].count, 10);
      const totalNecessario = gf.total_parcelas;
      const faltam = totalNecessario - criadas;

      if (faltam > 0) {
        let maxParcela = txResult.rows[0].max_parcela ? parseInt(txResult.rows[0].max_parcela, 10) : criadas;
        let lastDate = txResult.rows[0].max_data ? new Date(txResult.rows[0].max_data) : new Date(gf.data_criacao || new Date());

        let currMes = lastDate.getUTCMonth() + 1;
        let currAno = lastDate.getUTCFullYear();

        if (txResult.rows[0].max_data) {
          currMes += 1;
          if (currMes > 12) {
            currMes = 1;
            currAno += 1;
          }
        }

        const diaVencimento = (gf.tipo_pagamento === 'credito' && gf.cartao_vencimento)
          ? gf.cartao_vencimento
          : gf.dia_vencimento;

        for (let i = 0; i < faltam; i++) {
          const pAtual = maxParcela + 1 + i;
          const effectiveDay = Math.min(diaVencimento, lastDayOfMonth(currAno, currMes));
          const dataTransacao = `${currAno}-${String(currMes).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;

          await client.query(
            `INSERT INTO transacoes (
               user_id, data, descricao, valor, tipo, tipo_pagamento,
               categoria_id, conta_id, cartao_id, pago, gasto_fixo_id,
               parcela_atual, total_parcelas, fatura_mes, fatura_ano
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, $10, $11, $12, $13, $14)`,
            [
              userId, dataTransacao, gf.nome, gf.valor, gf.tipo, gf.tipo_pagamento || 'pix',
              gf.categoria_id, gf.conta_id, gf.cartao_id, gf.id,
              pAtual, totalNecessario,
              gf.cartao_id ? currMes : null, gf.cartao_id ? currAno : null
            ]
          );

          currMes += 1;
          if (currMes > 12) {
            currMes = 1;
            currAno += 1;
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar parcelas de gastos fixos:', err);
  } finally {
    client.release();
  }
}

// Listar gastos fixos
router.get('/', async (req, res) => {
  try {
    await sincronizarParcelasGastosFixos(req.userId);

    const result = await pool.query(
      `SELECT gf.*, c.nome as categoria_nome, c.cor as categoria_cor,
              ct.nome as conta_nome, cr.nome as cartao_nome, cr.cor as cartao_cor, cr.bandeira as cartao_bandeira
       FROM gastos_fixos gf
       LEFT JOIN categorias c ON gf.categoria_id = c.id
       LEFT JOIN contas ct ON gf.conta_id = ct.id
       LEFT JOIN cartoes cr ON gf.cartao_id = cr.id
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
    const { nome, valor, dia_vencimento, tipo_pagamento, categoria_id, conta_id, cartao_id, total_parcelas, tipo } = req.body;
    const tipoFinal = tipo || 'despesa';

    let diaVencimentoFinal = dia_vencimento ? parseInt(dia_vencimento, 10) : null;
    if (tipo_pagamento === 'credito' && cartao_id) {
      const cartaoRes = await client.query('SELECT dia_vencimento FROM cartoes WHERE id = $1 AND user_id = $2', [cartao_id, req.userId]);
      if (cartaoRes.rows.length > 0) {
        diaVencimentoFinal = cartaoRes.rows[0].dia_vencimento;
      }
    }

    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(valor, 'Valor', { min: 0.01 }),
      validateInteger(diaVencimentoFinal, 'Dia de vencimento', { min: 1, max: 31 }),
      validateEnum(tipo_pagamento, 'Tipo de pagamento', ['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
      validateEnum(tipo, 'Tipo', ['receita', 'despesa']),
    ].filter(Boolean);
    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: errors[0] });
    }

    const result = await client.query(
      `INSERT INTO gastos_fixos (user_id, nome, valor, dia_vencimento, tipo_pagamento, categoria_id, conta_id, cartao_id, total_parcelas, tipo, data_criacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE) RETURNING *`,
      [req.userId, nome, valor, diaVencimentoFinal, tipo_pagamento || null, categoria_id || null, conta_id || null, cartao_id || null, total_parcelas || null, tipoFinal]
    );

    const gastoFixo = result.rows[0];
    const hoje = new Date();
    let currAno = hoje.getFullYear();
    let currMes = hoje.getMonth() + 1;
    let parcelaAtual = 1;
    let transacoesCriadas = 0;
    const qtdParaGerar = total_parcelas ? parseInt(total_parcelas, 10) : 12;

    for (let i = 0; i < qtdParaGerar; i++) {
      let m = currMes + i;
      let a = currAno;
      while (m > 12) {
        m -= 12;
        a += 1;
      }

      const effectiveDay = Math.min(diaVencimentoFinal, lastDayOfMonth(a, m));
      const dataTransacao = `${a}-${String(m).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
      await client.query(
        `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, cartao_id, pago, gasto_fixo_id, parcela_atual, total_parcelas, fatura_mes, fatura_ano)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, $10, $11, $12, $13, $14)`,
        [
          req.userId, dataTransacao, nome, valor, tipoFinal, tipo_pagamento || 'pix',
          categoria_id || null, conta_id || null, cartao_id || null, gastoFixo.id,
          total_parcelas ? parcelaAtual : null, total_parcelas || 1,
          cartao_id ? m : null, cartao_id ? a : null
        ]
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
    const { nome, valor, dia_vencimento, tipo_pagamento, categoria_id, conta_id, cartao_id, total_parcelas, tipo } = req.body;
    const tipoFinal = tipo || 'despesa';

    let diaVencimentoFinal = dia_vencimento ? parseInt(dia_vencimento, 10) : null;
    if (tipo_pagamento === 'credito' && cartao_id) {
      const cartaoRes = await client.query('SELECT dia_vencimento FROM cartoes WHERE id = $1 AND user_id = $2', [cartao_id, req.userId]);
      if (cartaoRes.rows.length > 0) {
        diaVencimentoFinal = cartaoRes.rows[0].dia_vencimento;
      }
    }

    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(valor, 'Valor', { min: 0.01 }),
      validateInteger(diaVencimentoFinal, 'Dia de vencimento', { min: 1, max: 31 }),
      validateEnum(tipo_pagamento, 'Tipo de pagamento', ['credito', 'debito', 'pix', 'dinheiro', 'boleto']),
      validateEnum(tipo, 'Tipo', ['receita', 'despesa']),
    ].filter(Boolean);
    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: errors[0] });
    }

    const result = await client.query(
      `UPDATE gastos_fixos SET nome = $1, valor = $2, dia_vencimento = $3, tipo_pagamento = $4,
       categoria_id = $5, conta_id = $6, cartao_id = $7, total_parcelas = $8, tipo = $9
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [nome, valor, diaVencimentoFinal, tipo_pagamento || null, categoria_id || null, conta_id || null, cartao_id || null, total_parcelas || null, tipoFinal, id, req.userId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Gasto fixo não encontrado' });
    }

    // Atualizar transações não pagas vinculadas
    await client.query(
      `UPDATE transacoes SET valor = $1, descricao = $2, tipo = $3, tipo_pagamento = $4,
       categoria_id = $5, conta_id = $6, cartao_id = $7
       WHERE gasto_fixo_id = $8 AND user_id = $9 AND pago = FALSE`,
      [valor, nome, tipoFinal, tipo_pagamento || 'pix', categoria_id || null, conta_id || null, cartao_id || null, id, req.userId]
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
        const txInfo = await client.query(
          'SELECT MAX(parcela_atual) as max_p, MAX(data) as max_d FROM transacoes WHERE gasto_fixo_id = $1 AND user_id = $2',
          [id, req.userId]
        );
        let parcelaBase = txInfo.rows[0].max_p ? parseInt(txInfo.rows[0].max_p, 10) + 1 : pagas + naoPagas + 1;
        let lastDate = txInfo.rows[0].max_d ? new Date(txInfo.rows[0].max_d) : new Date();

        let currMes = lastDate.getUTCMonth() + 1;
        let currAno = lastDate.getUTCFullYear();

        if (txInfo.rows[0].max_d) {
          currMes += 1;
          if (currMes > 12) {
            currMes = 1;
            currAno += 1;
          }
        }

        for (let i = 0; i < faltam; i++) {
          const effectiveDay = Math.min(diaVencimentoFinal, lastDayOfMonth(currAno, currMes));
          const dataTransacao = `${currAno}-${String(currMes).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;

          await client.query(
            `INSERT INTO transacoes (
               user_id, data, descricao, valor, tipo, tipo_pagamento,
               categoria_id, conta_id, cartao_id, pago, gasto_fixo_id,
               parcela_atual, total_parcelas, fatura_mes, fatura_ano
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, $10, $11, $12, $13, $14)`,
            [
              req.userId, dataTransacao, nome, valor, tipoFinal, tipo_pagamento || 'pix',
              categoria_id || null, conta_id || null, cartao_id || null, id,
              parcelaBase + i, total_parcelas,
              cartao_id ? currMes : null, cartao_id ? currAno : null
            ]
          );

          currMes += 1;
          if (currMes > 12) {
            currMes = 1;
            currAno += 1;
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

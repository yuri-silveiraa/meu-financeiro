import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateString, validateNumber, validateInteger } from '../middleware/validate.js';
import { getProximoDiaUtil } from '../utils/fatura.js';
import { sincronizarParcelasGastosFixos } from './gastosFixos.js';

const router = Router();
router.use(authMiddleware);

// Listar todos os cartões do usuário com limites e valores da fatura atual
router.get('/', async (req, res) => {
  try {
    await sincronizarParcelasGastosFixos(req.userId);

    const query = `
      SELECT 
        c.*,
        ct.nome as conta_padrao_nome,
        COALESCE(
          (SELECT SUM(t.valor) 
           FROM transacoes t 
           WHERE t.cartao_id = c.id 
             AND t.user_id = $1 
             AND t.tipo = 'despesa' 
             AND t.pago = FALSE), 0
        ) as limite_comprometido
      FROM cartoes c
      LEFT JOIN contas ct ON c.conta_padrao_id = ct.id
      WHERE c.user_id = $1
      ORDER BY c.nome ASC
    `;

    const result = await pool.query(query, [req.userId]);

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    const cartoesComTotais = await Promise.all(
      result.rows.map(async (cartao) => {
        const limiteTotal = parseFloat(cartao.limite || 0);
        const limiteComprometido = parseFloat(cartao.limite_comprometido || 0);
        const limiteDisponivel = Math.max(0, limiteTotal - limiteComprometido);

        // Fatura do mês atual
        const faturaAtualResult = await pool.query(
          `SELECT COALESCE(SUM(valor), 0) as total, COUNT(*) as qtd
           FROM transacoes
           WHERE cartao_id = $1 AND user_id = $2 AND tipo = 'despesa' AND fatura_ano = $3 AND fatura_mes = $4`,
          [cartao.id, req.userId, anoAtual, mesAtual]
        );

        return {
          ...cartao,
          limite: limiteTotal,
          limite_comprometido: limiteComprometido,
          limite_disponivel: Math.round(limiteDisponivel * 100) / 100,
          fatura_atual_total: parseFloat(faturaAtualResult.rows[0].total || 0),
          fatura_atual_qtd: parseInt(faturaAtualResult.rows[0].qtd || 0, 10),
        };
      })
    );

    res.json(cartoesComTotais);
  } catch (error) {
    console.error('Erro ao buscar cartões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar cartão
router.post('/', async (req, res) => {
  try {
    const { nome, bandeira, limite, dia_fechamento, dia_vencimento, conta_padrao_id, cor } = req.body;

    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(limite, 'Limite', { min: 0 }),
      validateInteger(dia_fechamento, 'Dia de fechamento', { min: 1, max: 31 }),
      validateInteger(dia_vencimento, 'Dia de vencimento', { min: 1, max: 31 }),
    ].filter(Boolean);

    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const result = await pool.query(
      `INSERT INTO cartoes (user_id, nome, bandeira, limite, dia_fechamento, dia_vencimento, conta_padrao_id, cor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.userId,
        nome.trim(),
        bandeira || 'outro',
        limite,
        dia_fechamento,
        dia_vencimento,
        conta_padrao_id || null,
        cor || '#6366f1',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter detalhes de um cartão
router.get('/:id', async (req, res) => {
  try {
    await sincronizarParcelasGastosFixos(req.userId);
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, ct.nome as conta_padrao_nome
       FROM cartoes c
       LEFT JOIN contas ct ON c.conta_padrao_id = ct.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const cartao = result.rows[0];

    // Limite comprometido
    const compResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total
       FROM transacoes
       WHERE cartao_id = $1 AND user_id = $2 AND tipo = 'despesa' AND pago = FALSE`,
      [id, req.userId]
    );

    const limiteTotal = parseFloat(cartao.limite || 0);
    const limiteComprometido = parseFloat(compResult.rows[0].total || 0);
    const limiteDisponivel = Math.max(0, limiteTotal - limiteComprometido);

    res.json({
      ...cartao,
      limite: limiteTotal,
      limite_comprometido: limiteComprometido,
      limite_disponivel: Math.round(limiteDisponivel * 100) / 100,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do cartão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar cartão
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, bandeira, limite, dia_fechamento, dia_vencimento, conta_padrao_id, cor } = req.body;

    const errors = [
      validateString(nome, 'Nome', { max: 100 }),
      validateNumber(limite, 'Limite', { min: 0 }),
      validateInteger(dia_fechamento, 'Dia de fechamento', { min: 1, max: 31 }),
      validateInteger(dia_vencimento, 'Dia de vencimento', { min: 1, max: 31 }),
    ].filter(Boolean);

    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const result = await pool.query(
      `UPDATE cartoes 
       SET nome = $1, bandeira = $2, limite = $3, dia_fechamento = $4, dia_vencimento = $5,
           conta_padrao_id = $6, cor = $7
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [
        nome.trim(),
        bandeira || 'outro',
        limite,
        dia_fechamento,
        dia_vencimento,
        conta_padrao_id || null,
        cor || '#6366f1',
        id,
        req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Excluir cartão
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    // Desvincula transações do cartão antes de excluir
    await client.query(
      'UPDATE transacoes SET cartao_id = NULL WHERE cartao_id = $1 AND user_id = $2',
      [id, req.userId]
    );

    const result = await client.query(
      'DELETE FROM cartoes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao excluir cartão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// Listar faturas de um cartão (agrupadas por ano e mês)
router.get('/:id/faturas', async (req, res) => {
  try {
    await sincronizarParcelasGastosFixos(req.userId);
    const { id } = req.params;

    // Verificar se o cartão pertence ao usuário
    const cartaoCheck = await pool.query(
      'SELECT id, dia_vencimento FROM cartoes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (cartaoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const { dia_vencimento } = cartaoCheck.rows[0];

    const result = await pool.query(
      `SELECT 
         fatura_ano,
         fatura_mes,
         COUNT(*) as quantidade_transacoes,
         SUM(valor) as total,
         BOOL_AND(pago) as pago
       FROM transacoes
       WHERE cartao_id = $1 AND user_id = $2 AND tipo = 'despesa' AND fatura_ano IS NOT NULL AND fatura_mes IS NOT NULL
       GROUP BY fatura_ano, fatura_mes
       ORDER BY fatura_ano DESC, fatura_mes DESC`,
      [id, req.userId]
    );

    const faturas = result.rows.map((row) => {
      const mes = parseInt(row.fatura_mes, 10);
      const ano = parseInt(row.fatura_ano, 10);
      const ultimoDiaMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
      const diaReal = Math.min(dia_vencimento, ultimoDiaMes);
      const dataBase = `${ano}-${String(mes).padStart(2, '0')}-${String(diaReal).padStart(2, '0')}`;
      const dataVencimento = getProximoDiaUtil(dataBase);

      return {
        fatura_ano: ano,
        fatura_mes: mes,
        quantidade_transacoes: parseInt(row.quantidade_transacoes, 10),
        total: parseFloat(row.total || 0),
        pago: Boolean(row.pago),
        data_vencimento: dataVencimento,
      };
    });

    res.json(faturas);
  } catch (error) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Detalhes e lançamentos da fatura de um mês/ano específico
router.get('/:id/faturas/:ano/:mes', async (req, res) => {
  try {
    const { id, ano, mes } = req.params;
    const anoNum = parseInt(ano, 10);
    const mesNum = parseInt(mes, 10);

    const cartaoResult = await pool.query(
      `SELECT c.*, ct.nome as conta_padrao_nome
       FROM cartoes c
       LEFT JOIN contas ct ON c.conta_padrao_id = ct.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.userId]
    );

    if (cartaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const cartao = cartaoResult.rows[0];

    const transacoesResult = await pool.query(
      `SELECT t.*, cat.nome as categoria_nome, cat.cor as categoria_cor, cat.icone as categoria_icone
       FROM transacoes t
       LEFT JOIN categorias cat ON t.categoria_id = cat.id
       WHERE t.cartao_id = $1 AND t.user_id = $2 AND t.fatura_ano = $3 AND t.fatura_mes = $4
       ORDER BY t.data ASC, t.id ASC`,
      [id, req.userId, anoNum, mesNum]
    );

    const transacoes = transacoesResult.rows;
    const total = transacoes.reduce((acc, t) => acc + (t.tipo === 'despesa' ? parseFloat(t.valor) : -parseFloat(t.valor)), 0);
    const todasPagas = transacoes.length > 0 && transacoes.every((t) => t.pago);

    const ultimoDiaMes = new Date(Date.UTC(anoNum, mesNum, 0)).getUTCDate();
    const diaReal = Math.min(cartao.dia_vencimento, ultimoDiaMes);
    const dataBase = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(diaReal).padStart(2, '0')}`;
    const dataVencimento = getProximoDiaUtil(dataBase);

    res.json({
      cartao,
      fatura_ano: anoNum,
      fatura_mes: mesNum,
      total: Math.round(total * 100) / 100,
      pago: todasPagas,
      data_vencimento: dataVencimento,
      transacoes,
    });
  } catch (error) {
    console.error('Erro ao buscar fatura detalhada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Pagar fatura (marca transações da fatura como pagas e debita na conta informada)
router.post('/:id/faturas/:ano/:mes/pagar', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id, ano, mes } = req.params;
    const { conta_id, data_pagamento } = req.body;
    const anoNum = parseInt(ano, 10);
    const mesNum = parseInt(mes, 10);

    await client.query('BEGIN');

    // Valida cartão
    const cartaoResult = await client.query(
      'SELECT * FROM cartoes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (cartaoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    const cartao = cartaoResult.rows[0];

    const contaDebitoId = conta_id || cartao.conta_padrao_id;

    // Atualiza transações da fatura marcando-as como pagas
    const updateResult = await client.query(
      `UPDATE transacoes 
       SET pago = TRUE, conta_id = COALESCE($1, conta_id)
       WHERE cartao_id = $2 AND fatura_ano = $3 AND fatura_mes = $4 AND user_id = $5 AND pago = FALSE
       RETURNING *`,
      [contaDebitoId || null, id, anoNum, mesNum, req.userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      transacoes_pagas: updateResult.rowCount,
      mensagem: `Fatura ${mesNum}/${anoNum} do cartão ${cartao.nome} liquidada com sucesso!`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao pagar fatura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

export default router;

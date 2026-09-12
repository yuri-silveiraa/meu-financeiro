import { Router } from 'express';
import pool from '../config/database.js';
import { pendingLinks } from './whatsapp.js';

const router = Router();

// Middleware de autenticação interna (API key)
function botAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!process.env.BOT_API_KEY || apiKey !== process.env.BOT_API_KEY) {
    return res.status(401).json({ error: 'API key inválida' });
  }
  next();
}

router.use(botAuth);

// Buscar usuário pelo número do WhatsApp
router.get('/user/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    if (!/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({ error: 'Formato de telefone inválido' });
    }
    const result = await pool.query(
      'SELECT id, email, name, whatsapp_number FROM users WHERE whatsapp_number = $1',
      [phone]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Vincular número WhatsApp a um usuário
router.post('/link', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    if (!userId || !phoneNumber) {
      return res.status(400).json({ error: 'userId e phoneNumber obrigatórios' });
    }
    if (!/^\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Formato de telefone inválido' });
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const result = await pool.query(
      'UPDATE users SET whatsapp_number = $1 WHERE id = $2 RETURNING id, name, whatsapp_number',
      [phoneNumber, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao vincular WhatsApp:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar transação
router.post('/transacao', async (req, res) => {
  try {
    const { userId, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id } = req.body;
    if (!userId || !valor || !tipo) {
      return res.status(400).json({ error: 'userId, valor e tipo obrigatórios' });
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    if (typeof valor !== 'number' || valor <= 0) {
      return res.status(400).json({ error: 'valor deve ser um número positivo' });
    }
    if (!['receita', 'despesa'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo deve ser "receita" ou "despesa"' });
    }
    if (tipo_pagamento && !['credito', 'debito', 'pix', 'dinheiro', 'boleto'].includes(tipo_pagamento)) {
      return res.status(400).json({ error: 'tipo_pagamento inválido' });
    }
    const result = await pool.query(
      `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *`,
      [
        userId,
        data || new Date().toISOString().split('T')[0],
        descricao || null,
        valor,
        tipo,
        tipo_pagamento || null,
        categoria_id || null,
        conta_id || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar estatísticas do mês
router.get('/estatisticas/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = parseInt(userId, 10);
    if (!uid || uid <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const mes = parseInt(req.query.mes, 10) || new Date().getMonth() + 1;
    const ano = parseInt(req.query.ano, 10) || new Date().getFullYear();
    if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) {
      return res.status(400).json({ error: 'Mês ou ano inválido' });
    }
    const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const lastDay = new Date(ano, mes, 0).getDate();
    const endDate = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const receitasResult = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = $1 AND tipo = $2 AND data >= $3 AND data <= $4',
      [uid, 'receita', startDate, endDate]
    );
    const despesasResult = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = $1 AND tipo = $2 AND data >= $3 AND data <= $4',
      [uid, 'despesa', startDate, endDate]
    );
    const despesasNaoPagasResult = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = $1 AND tipo = $2 AND pago = false AND data >= $3 AND data <= $4',
      [uid, 'despesa', startDate, endDate]
    );

    const receitas = parseFloat(receitasResult.rows[0].total);
    const despesas = parseFloat(despesasResult.rows[0].total);
    const despesasNaoPagas = parseFloat(despesasNaoPagasResult.rows[0].total);

    res.json({
      mes,
      ano,
      receitas,
      despesas,
      saldo: receitas - despesas,
      saldoProjetado: receitas - despesas - despesasNaoPagas,
      despesasNaoPagas
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar categorias do usuário
router.get('/categorias/:userId', async (req, res) => {
  try {
    const uid = parseInt(req.params.userId, 10);
    if (!uid || uid <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const result = await pool.query(
      'SELECT id, nome, cor FROM categorias WHERE user_id = $1 ORDER BY nome',
      [uid]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar gastos fixos do usuário
router.get('/gastos-fixos/:userId', async (req, res) => {
  try {
    const uid = parseInt(req.params.userId, 10);
    if (!uid || uid <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const result = await pool.query(
      `SELECT gf.nome, gf.valor, gf.dia_vencimento, gf.tipo, gf.tipo_pagamento,
              c.nome as categoria_nome
       FROM gastos_fixos gf
       LEFT JOIN categorias c ON gf.categoria_id = c.id
       WHERE gf.user_id = $1 AND gf.ativo = true
       ORDER BY gf.dia_vencimento`,
      [uid]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar gastos fixos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar transações do mês
router.get('/transacoes/:userId', async (req, res) => {
  try {
    const uid = parseInt(req.params.userId, 10);
    if (!uid || uid <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const mes = parseInt(req.query.mes, 10) || new Date().getMonth() + 1;
    const ano = parseInt(req.query.ano, 10) || new Date().getFullYear();
    if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) {
      return res.status(400).json({ error: 'Mês ou ano inválido' });
    }
    const { tipo, pago } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const lastDay = new Date(ano, mes, 0).getDate();
    const endDate = `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let query = `
      SELECT t.*, c.nome as categoria_nome
      FROM transacoes t
      LEFT JOIN categorias c ON t.categoria_id = c.id
      WHERE t.user_id = $1 AND t.data >= $2 AND t.data <= $3
    `;
    const params = [uid, startDate, endDate];
    let paramIndex = 4;

    if (tipo) {
      if (!['receita', 'despesa'].includes(tipo)) {
        return res.status(400).json({ error: 'tipo inválido' });
      }
      query += ` AND t.tipo = $${paramIndex++}`;
      params.push(tipo);
    }
    if (pago !== undefined && pago !== '') {
      query += ` AND t.pago = $${paramIndex++}`;
      params.push(pago === 'true');
    }

    query += ` ORDER BY t.data DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar alertas do usuário
router.get('/alertas/:userId', async (req, res) => {
  try {
    const uid = parseInt(req.params.userId, 10);
    if (!uid || uid <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const now = new Date();
    const mesAtual = now.getMonth() + 1;
    const anoAtual = now.getFullYear();
    const startDate = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
    const lastDayAtual = new Date(anoAtual, mesAtual, 0).getDate();
    const endDate = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(lastDayAtual).padStart(2, '0')}`;
    const diaAtual = now.getDate();

    const alertas = [];

    const proximosVencimentos = await pool.query(
      `SELECT nome, valor, dia_vencimento
       FROM gastos_fixos
       WHERE user_id = $1 AND ativo = true AND dia_vencimento BETWEEN $2 AND $3
       ORDER BY dia_vencimento`,
      [uid, diaAtual, diaAtual + 3]
    );
    for (const gf of proximosVencimentos.rows) {
      const diff = gf.dia_vencimento - diaAtual;
      const quando = diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : `em ${diff} dias`;
      alertas.push({
        tipo: 'vencimento',
        mensagem: `📅 ${quando} vence: ${gf.nome} - R$ ${parseFloat(gf.valor).toFixed(2)}`
      });
    }

    const gastosPorCategoria = await pool.query(
      `SELECT c.nome, COALESCE(SUM(t.valor), 0) as gasto_mes
       FROM categorias c
       LEFT JOIN transacoes t ON t.categoria_id = c.id AND t.data >= $2 AND t.data <= $3 AND t.tipo = 'despesa'
       WHERE c.user_id = $1
       GROUP BY c.id, c.nome
       HAVING COALESCE(SUM(t.valor), 0) > 0`,
      [uid, startDate, endDate]
    );

    const tresMesesAtras = new Date(anoAtual, mesAtual - 4, 1);
    const mediaHistorica = await pool.query(
      `SELECT c.nome, AVG(g.mensal) as media
       FROM categorias c
       LEFT JOIN (
         SELECT categoria_id, SUM(valor) as mensal, DATE_TRUNC('month', data) as mes
         FROM transacoes
         WHERE user_id = $1 AND tipo = 'despesa' AND data >= $4
         GROUP BY categoria_id, DATE_TRUNC('month', data)
       ) g ON g.categoria_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id, c.nome`,
      [uid, startDate, endDate, tresMesesAtras.toISOString().split('T')[0]]
    );

    const mediaMap = {};
    for (const row of mediaHistorica.rows) {
      if (row.media) mediaMap[row.nome] = parseFloat(row.media);
    }

    for (const row of gastosPorCategoria.rows) {
      const media = mediaMap[row.nome];
      if (media && media > 0) {
        const percentual = (parseFloat(row.gasto_mes) / media) * 100;
        if (percentual >= 80) {
          alertas.push({
            tipo: 'orcamento',
            mensagem: `⚠️ Você já gastou ${percentual.toFixed(0)}% do orçamento de ${row.nome} este mês!`
          });
        }
      }
    }

    const statsResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitas,
         COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesas
       FROM transacoes
       WHERE user_id = $1 AND data >= $2 AND data <= $3`,
      [uid, startDate, endDate]
    );
    const { receitas, despesas } = statsResult.rows[0];
    const saldo = parseFloat(receitas) - parseFloat(despesas);
    if (saldo < 0) {
      alertas.push({
        tipo: 'saldo_negativo',
        mensagem: `🔴 Saldo negativo! Você está devendo R$ ${Math.abs(saldo).toFixed(2)}`
      });
    }

    res.json(alertas);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Armazenamento temporário de códigos de vinculação (em memória)
// Em produção, usar Redis ou tabela dedicada sem FK constraint
// Os códigos são compartilhados com a rota /api/whatsapp (JWT auth)

// Listar usuários com WhatsApp vinculado (para alertas diários)
router.get('/users-with-whatsapp', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, whatsapp_number FROM users WHERE whatsapp_number IS NOT NULL'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários com WhatsApp:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Confirmar vinculação
router.post('/confirmar-vinculacao', async (req, res) => {
  try {
    const { phoneNumber, code, userId } = req.body;
    if (!phoneNumber || !code || !userId) {
      return res.status(400).json({ error: 'phoneNumber, code e userId obrigatórios' });
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'userId inválido' });
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const pending = pendingLinks.get(phoneNumber);
    if (!pending) {
      return res.status(400).json({ error: 'Código não encontrado' });
    }
    if (Date.now() > pending.expiresAt) {
      pendingLinks.delete(phoneNumber);
      return res.status(400).json({ error: 'Código expirado' });
    }
    if (pending.code !== code) {
      return res.status(400).json({ error: 'Código inválido' });
    }
    if (pending.userId !== userId) {
      return res.status(403).json({ error: 'Código não pertence a este usuário' });
    }

    pendingLinks.delete(phoneNumber);
    await pool.query('UPDATE users SET whatsapp_number = $1 WHERE id = $2', [phoneNumber, userId]);

    res.json({ success: true, message: 'WhatsApp vinculado com sucesso!' });
  } catch (error) {
    console.error('Erro ao confirmar vinculação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar código de vinculação (usado pelo bot)
router.get('/verificar-codigo/:phone/:code', async (req, res) => {
  try {
    const { phone, code } = req.params;
    if (!phone || !code) {
      return res.status(400).json({ error: 'phone e code obrigatórios' });
    }

    const pending = pendingLinks.get(phone);
    if (!pending) {
      return res.json({ valid: false, error: 'Código não encontrado' });
    }
    if (Date.now() > pending.expiresAt) {
      pendingLinks.delete(phone);
      return res.json({ valid: false, error: 'Código expirado' });
    }
    if (pending.code !== code) {
      return res.json({ valid: false, error: 'Código inválido' });
    }

    res.json({ valid: true, userId: pending.userId });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

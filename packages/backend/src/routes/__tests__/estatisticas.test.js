import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import { initTestDatabase, resetDatabase, createTestUser, createTestCategory, createTestConta, createTestCartao, createTestTransacao, closePool, getPool } from '../../test/setup.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci-only-do-not-use-in-production';
let app;
let user;
let token;

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.BOT_API_KEY = 'test-bot-api-key-for-ci-only-do-not-use-in-production';
  await initTestDatabase();
  app = createApp();
});

beforeEach(async () => {
  await resetDatabase();
  user = await createTestUser();
  token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await closePool();
});

describe('GET /api/estatisticas', () => {
  it('returns 400 without mes and ano', async () => {
    const res = await request(app)
      .get('/api/estatisticas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid mes', async () => {
    const res = await request(app)
      .get('/api/estatisticas?mes=13&ano=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid ano', async () => {
    const res = await request(app)
      .get('/api/estatisticas?mes=1&ano=1999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('returns stats for valid month', async () => {
    const cat = await createTestCategory(user.id);
    const conta = await createTestConta(user.id);

    // Create some transactions in January 2026
    await createTestTransacao(user.id, { data: '2026-01-10', tipo: 'receita', valor: 5000, categoria_id: cat.id, conta_id: conta.id });
    await createTestTransacao(user.id, { data: '2026-01-15', tipo: 'despesa', valor: 1500, pago: true, categoria_id: cat.id, conta_id: conta.id });
    await createTestTransacao(user.id, { data: '2026-01-20', tipo: 'despesa', valor: 200, pago: false, categoria_id: cat.id, conta_id: conta.id });

    const res = await request(app)
      .get('/api/estatisticas?mes=1&ano=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.receitas).toBe(5000);
    expect(res.body.despesas).toBe(1700);
    expect(res.body.saldo).toBe(3300);
    expect(res.body.despesasNaoPagas).toBe(200);
    expect(res.body.limitesCartoes).toBeDefined();
    expect(res.body.faturasMes).toBeDefined();
    expect(res.body.projecaoFaturas).toBeDefined();
    expect(res.body.projecaoFaturas.length).toBe(6);
  });

  it('returns card invoice and limits correctly in monthly stats', async () => {
    const cat = await createTestCategory(user.id);
    const cartao = await createTestCartao(user.id, { nome: 'Nubank', limite: 2000 });
    const p = getPool();

    // Inserir compra no cartão com fatura em janeiro de 2026
    await p.query(
      `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, cartao_id, fatura_mes, fatura_ano, pago)
       VALUES ($1, '2026-01-05', 'Notebook Parcela 1', 500, 'despesa', 'credito', $2, $3, 1, 2026, FALSE)`,
      [user.id, cat.id, cartao.id]
    );

    const res = await request(app)
      .get('/api/estatisticas?mes=1&ano=2026')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.despesas).toBe(500);
    expect(res.body.despesasNaoPagas).toBe(500);
    expect(res.body.faturasMes.total).toBe(500);
    expect(res.body.faturasMes.totalAbertas).toBe(500);
    expect(res.body.faturasMes.qtd).toBe(1);
    expect(res.body.faturasMes.todasPagas).toBe(false);
    expect(res.body.limitesCartoes.limiteTotal).toBe(2000);
    expect(res.body.limitesCartoes.limiteComprometido).toBe(500);
    expect(res.body.limitesCartoes.limiteDisponivel).toBe(1500);
    expect(res.body.limitesCartoes.percentualUsado).toBe(25);
  });

  it('returns zeros for month with no transactions', async () => {
    const res = await request(app)
      .get('/api/estatisticas?mes=6&ano=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.receitas).toBe(0);
    expect(res.body.despesas).toBe(0);
    expect(res.body.saldo).toBe(0);
    expect(res.body.faturasMes.total).toBe(0);
  });
});

describe('GET /api/estatisticas/cartoes-anual', () => {
  it('returns 12 months with invoice data for year', async () => {
    const cat = await createTestCategory(user.id);
    const cartao = await createTestCartao(user.id, { nome: 'Inter', limite: 3000 });
    const p = getPool();

    // Inserir compra faturada em março de 2026
    await p.query(
      `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, cartao_id, fatura_mes, fatura_ano, pago)
       VALUES ($1, '2026-03-05', 'Supermercado', 350, 'despesa', 'credito', $2, $3, 3, 2026, TRUE)`,
      [user.id, cat.id, cartao.id]
    );

    const res = await request(app)
      .get('/api/estatisticas/cartoes-anual?ano=2026')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ano).toBe(2026);
    expect(res.body.dadosMensais.length).toBe(12);
    expect(res.body.totalAno).toBe(350);
    expect(res.body.totalPagoAno).toBe(350);
    expect(res.body.dadosMensais[2].total).toBe(350); // Março
    expect(res.body.dadosMensais[2].totalPago).toBe(350);
  });
});

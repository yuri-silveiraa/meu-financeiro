import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import { initTestDatabase, resetDatabase, createTestUser, createTestCategory, createTestConta, createTestTransacao, closePool } from '../../test/setup.js';

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
  });

  it('returns zeros for month with no transactions', async () => {
    const res = await request(app)
      .get('/api/estatisticas?mes=6&ano=2026')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.receitas).toBe(0);
    expect(res.body.despesas).toBe(0);
    expect(res.body.saldo).toBe(0);
  });
});

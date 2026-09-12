import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import { initTestDatabase, resetDatabase, createTestUser, createTestCategory, createTestConta, closePool, getPool } from '../../test/setup.js';

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

describe('GET /api/gastos-fixos', () => {
  it('returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/gastos-fixos', () => {
  it('creates a gasto fixo and generates transactions', async () => {
    const res = await request(app)
      .post('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Aluguel',
        valor: 1500,
        dia_vencimento: 10,
        tipo_pagamento: 'boleto',
        tipo: 'despesa',
      });
    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Aluguel');
    expect(res.body.transacoesCriadas).toBeGreaterThan(0);
  });

  it('clamps day to last day of month when dia_vencimento exceeds month length', async () => {
    const res = await request(app)
      .post('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Teste Clamp',
        valor: 100,
        dia_vencimento: 31,
        tipo: 'despesa',
      });
    expect(res.status).toBe(201);

    // The route generates transactions from current month to December.
    // For any generated month, day should never exceed that month's last day.
    const pool = getPool();
    const txResult = await pool.query(
      "SELECT data FROM transacoes WHERE user_id = $1 AND descricao = 'Teste Clamp'",
      [user.id]
    );
    for (const row of txResult.rows) {
      const d = row.data;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      expect(d.getDate()).toBeLessThanOrEqual(lastDay);
    }
  });

  it('respects total_parcelas limit', async () => {
    const res = await request(app)
      .post('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Parcela',
        valor: 100,
        dia_vencimento: 5,
        tipo: 'despesa',
        total_parcelas: 3,
      });
    expect(res.status).toBe(201);
    expect(res.body.transacoesCriadas).toBe(3);
  });

  it('returns 400 for missing nome', async () => {
    const res = await request(app)
      .post('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: '', valor: 100, dia_vencimento: 5 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid valor', async () => {
    const res = await request(app)
      .post('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Teste', valor: -10, dia_vencimento: 5 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/gastos-fixos/:id', () => {
  it('updates a gasto fixo', async () => {
    const createRes = await request(app)
      .post('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Original', valor: 100, dia_vencimento: 5, tipo: 'despesa' });
    const id = createRes.body.id;

    const res = await request(app)
      .put(`/api/gastos-fixos/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Atualizado', valor: 200, dia_vencimento: 10, tipo: 'despesa' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Atualizado');
  });

  it('returns 404 for non-existent gasto fixo', async () => {
    const res = await request(app)
      .put('/api/gastos-fixos/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'X', valor: 100, dia_vencimento: 5, tipo: 'despesa' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/gastos-fixos/:id', () => {
  it('soft deletes a gasto fixo', async () => {
    const createRes = await request(app)
      .post('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Para deletar', valor: 50, dia_vencimento: 15, tipo: 'despesa' });
    const id = createRes.body.id;

    const res = await request(app)
      .delete(`/api/gastos-fixos/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    // Should not appear in list anymore
    const list = await request(app)
      .get('/api/gastos-fixos')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(0);
  });
});

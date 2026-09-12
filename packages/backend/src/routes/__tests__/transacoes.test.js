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

describe('GET /api/transacoes', () => {
  it('returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/transacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns transactions for user', async () => {
    await createTestTransacao(user.id, { descricao: 'Compras' });
    const res = await request(app)
      .get('/api/transacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].descricao).toBe('Compras');
  });

  it('filters by tipo', async () => {
    await createTestTransacao(user.id, { tipo: 'despesa' });
    await createTestTransacao(user.id, { tipo: 'receita', valor: 200 });

    const res = await request(app)
      .get('/api/transacoes?tipo=receita')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('receita');
  });

  it('limits results', async () => {
    for (let i = 0; i < 5; i++) {
      await createTestTransacao(user.id, { descricao: `Tx ${i}` });
    }
    const res = await request(app)
      .get('/api/transacoes?limit=3')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(3);
  });
});

describe('POST /api/transacoes', () => {
  it('creates a transaction', async () => {
    const res = await request(app)
      .post('/api/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: '2026-01-15',
        descricao: 'Supermercado',
        valor: 150.50,
        tipo: 'despesa',
        tipo_pagamento: 'pix',
      });
    expect(res.status).toBe(201);
    expect(res.body.descricao).toBe('Supermercado');
    expect(parseFloat(res.body.valor)).toBe(150.50);
  });

  it('returns 400 for missing data', async () => {
    const res = await request(app)
      .post('/api/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ valor: 100, tipo: 'despesa' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid tipo', async () => {
    const res = await request(app)
      .post('/api/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: '2026-01-15', valor: 100, tipo: 'invalido' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/transacoes/:id', () => {
  it('updates a transaction', async () => {
    const tx = await createTestTransacao(user.id);
    const res = await request(app)
      .put(`/api/transacoes/${tx.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: '2026-01-15',
        descricao: 'Atualizado',
        valor: 200,
        tipo: 'receita',
        tipo_pagamento: 'pix',
      });
    expect(res.status).toBe(200);
    expect(res.body.descricao).toBe('Atualizado');
  });

  it('returns 404 for non-existent transaction', async () => {
    const res = await request(app)
      .put('/api/transacoes/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: '2026-01-15', descricao: 'X', valor: 100, tipo: 'despesa' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/transacoes/:id', () => {
  it('deletes a transaction', async () => {
    const tx = await createTestTransacao(user.id);
    const res = await request(app)
      .delete(`/api/transacoes/${tx.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const list = await request(app)
      .get('/api/transacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(0);
  });

  it('returns 404 for non-existent transaction', async () => {
    const res = await request(app)
      .delete('/api/transacoes/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/transacoes/:id/pago', () => {
  it('toggles pago from false to true', async () => {
    const tx = await createTestTransacao(user.id, { pago: false });
    const res = await request(app)
      .patch(`/api/transacoes/${tx.id}/pago`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pago).toBe(true);
  });

  it('toggles pago from true to false', async () => {
    const tx = await createTestTransacao(user.id, { pago: true });
    const res = await request(app)
      .patch(`/api/transacoes/${tx.id}/pago`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pago).toBe(false);
  });
});

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import { initTestDatabase, resetDatabase, createTestUser, createTestConta, closePool } from '../../test/setup.js';

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

describe('GET /api/contas', () => {
  it('returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/contas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns accounts for user', async () => {
    await createTestConta(user.id, { nome: 'Nubank' });
    const res = await request(app)
      .get('/api/contas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('Nubank');
  });
});

describe('POST /api/contas', () => {
  it('creates an account', async () => {
    const res = await request(app)
      .post('/api/contas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Itau', banco: 'Itau', tipo_conta: 'corrente', saldo_inicial: 1000 });
    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Itau');
    expect(res.body.banco).toBe('Itau');
  });

  it('returns 400 for missing nome', async () => {
    const res = await request(app)
      .post('/api/contas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: '' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/contas/:id', () => {
  it('updates an account', async () => {
    const conta = await createTestConta(user.id);
    const res = await request(app)
      .put(`/api/contas/${conta.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Atualizada', banco: 'Bradesco', tipo_conta: 'poupanca', saldo_inicial: 500 });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Atualizada');
  });

  it('returns 404 for non-existent account', async () => {
    const res = await request(app)
      .put('/api/contas/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'X', banco: 'Y', tipo_conta: 'corrente', saldo_inicial: 0 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/contas/:id', () => {
  it('deletes account and nullifies FK references', async () => {
    const conta = await createTestConta(user.id);

    // Create transaction referencing this account
    await request(app)
      .post('/api/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: '2026-01-15',
        descricao: 'Teste',
        valor: 50,
        tipo: 'despesa',
        tipo_pagamento: 'pix',
        conta_id: conta.id,
      });

    // Delete account
    const res = await request(app)
      .delete(`/api/contas/${conta.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    // Verify transaction still exists but with null conta_id
    const txGet = await request(app)
      .get('/api/transacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(txGet.body[0].conta_id).toBeNull();
  });

  it('returns 404 for non-existent account', async () => {
    const res = await request(app)
      .delete('/api/contas/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

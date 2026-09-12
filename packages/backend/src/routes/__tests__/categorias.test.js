import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import { initTestDatabase, resetDatabase, createTestUser, createTestCategory, createTestConta, closePool } from '../../test/setup.js';

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

describe('GET /api/categorias', () => {
  it('returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/categorias')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns categories for user', async () => {
    await createTestCategory(user.id, { nome: 'Alimentacao' });
    await createTestCategory(user.id, { nome: 'Transporte' });

    const res = await request(app)
      .get('/api/categorias')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].nome).toBe('Alimentacao');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/categorias');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/categorias', () => {
  it('creates a category', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Nova Categoria', cor: '#ff0000' });
    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Nova Categoria');
    expect(res.body.cor).toBe('#ff0000');
  });

  it('returns 400 for missing nome', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: '' });
    expect(res.status).toBe(400);
  });

  it('uses default cor when not provided', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Sem Cor' });
    expect(res.status).toBe(201);
    expect(res.body.cor).toBe('#6366f1');
  });
});

describe('PUT /api/categorias/:id', () => {
  it('updates a category', async () => {
    const cat = await createTestCategory(user.id);
    const res = await request(app)
      .put(`/api/categorias/${cat.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Atualizada', cor: '#00ff00', icone: 'folder' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Atualizada');
  });

  it('returns 404 for non-existent category', async () => {
    const res = await request(app)
      .put('/api/categorias/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'X', cor: '#000', icone: 'folder' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/categorias/:id', () => {
  it('deletes category and nullifies FK references', async () => {
    const cat = await createTestCategory(user.id);
    const conta = await createTestConta(user.id);

    // Create transaction referencing this category
    const txRes = await request(app)
      .post('/api/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        data: '2026-01-15',
        descricao: 'Teste',
        valor: 50,
        tipo: 'despesa',
        tipo_pagamento: 'pix',
        categoria_id: cat.id,
        conta_id: conta.id,
      });
    expect(txRes.status).toBe(201);

    // Delete category
    const res = await request(app)
      .delete(`/api/categorias/${cat.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    // Verify transaction still exists but with null categoria_id
    const txGet = await request(app)
      .get('/api/transacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(txGet.body[0].categoria_id).toBeNull();
  });

  it('returns 404 for non-existent category', async () => {
    const res = await request(app)
      .delete('/api/categorias/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

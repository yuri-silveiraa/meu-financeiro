import request from 'supertest';
import { createApp } from '../../app.js';
import { initTestDatabase, resetDatabase, createTestUser, closePool, getPool } from '../../test/setup.js';

const BOT_API_KEY = process.env.BOT_API_KEY || 'test-bot-api-key-for-ci-only-do-not-use-in-production';
let app;
let user;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-ci-only-do-not-use-in-production';
  process.env.BOT_API_KEY = BOT_API_KEY;
  await initTestDatabase();
  app = createApp();
});

beforeEach(async () => {
  await resetDatabase();
  user = await createTestUser({ whatsapp_number: null });
});

afterAll(async () => {
  await closePool();
});

describe('Bot API key auth', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app).get(`/bot/user/${user.id}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong API key', async () => {
    const res = await request(app)
      .get(`/bot/user/${user.id}`)
      .set('X-API-KEY', 'wrong-key');
    expect(res.status).toBe(401);
  });
});

describe('GET /bot/user/:phone', () => {
  it('returns user by phone number', async () => {
    const pool = getPool();
    await pool.query('UPDATE users SET whatsapp_number = $1 WHERE id = $2', ['5511999999999', user.id]);

    const res = await request(app)
      .get('/bot/user/5511999999999')
      .set('X-API-KEY', BOT_API_KEY);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });

  it('returns 404 for unknown phone', async () => {
    const res = await request(app)
      .get('/bot/user/5511000000000')
      .set('X-API-KEY', BOT_API_KEY);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid phone format', async () => {
    const res = await request(app)
      .get('/bot/user/abc')
      .set('X-API-KEY', BOT_API_KEY);
    expect(res.status).toBe(400);
  });
});

describe('POST /bot/transacao', () => {
  it('creates a transaction via bot', async () => {
    const res = await request(app)
      .post('/bot/transacao')
      .set('X-API-KEY', BOT_API_KEY)
      .send({
        userId: user.id,
        valor: 25.50,
        tipo: 'despesa',
        descricao: 'Cafe',
      });
    expect(res.status).toBe(201);
    expect(res.body.descricao).toBe('Cafe');
  });

  it('returns 400 for missing userId', async () => {
    const res = await request(app)
      .post('/bot/transacao')
      .set('X-API-KEY', BOT_API_KEY)
      .send({ valor: 100, tipo: 'despesa' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid tipo', async () => {
    const res = await request(app)
      .post('/bot/transacao')
      .set('X-API-KEY', BOT_API_KEY)
      .send({ userId: user.id, valor: 100, tipo: 'invalido' });
    expect(res.status).toBe(400);
  });
});

describe('GET /bot/users-with-whatsapp', () => {
  it('returns only users with whatsapp_number', async () => {
    const pool = getPool();
    await pool.query('UPDATE users SET whatsapp_number = $1 WHERE id = $2', ['5511999999999', user.id]);

    const res = await request(app)
      .get('/bot/users-with-whatsapp')
      .set('X-API-KEY', BOT_API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].whatsapp_number).toBe('5511999999999');
  });

  it('returns empty array when no users have whatsapp', async () => {
    const res = await request(app)
      .get('/bot/users-with-whatsapp')
      .set('X-API-KEY', BOT_API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

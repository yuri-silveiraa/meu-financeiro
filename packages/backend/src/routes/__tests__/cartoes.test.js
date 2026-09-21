import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app.js';
import {
  initTestDatabase,
  resetDatabase,
  createTestUser,
  createTestCartao,
  createTestConta,
  closePool,
} from '../../test/setup.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci-only-do-not-use-in-production';
const app = createApp();

function makeToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  await initTestDatabase();
});

afterAll(async () => {
  await closePool();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('Cartões e Faturas API', () => {
  describe('GET /api/cartoes', () => {
    it('returns empty array when user has no cards', async () => {
      const user = await createTestUser();
      const token = makeToken(user.id);

      const res = await request(app)
        .get('/api/cartoes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns cards with correct available limit calculation', async () => {
      const user = await createTestUser();
      const token = makeToken(user.id);
      const cartao = await createTestCartao(user.id, { limite: 2000 });

      // Add unpaid transaction of 500
      await request(app)
        .post('/api/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: '2026-05-10',
          descricao: 'Monitor',
          valor: 500,
          tipo: 'despesa',
          tipo_pagamento: 'credito',
          cartao_id: cartao.id,
        });

      const res = await request(app)
        .get('/api/cartoes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].limite).toBe(2000);
      expect(res.body[0].limite_comprometido).toBe(500);
      expect(res.body[0].limite_disponivel).toBe(1500);
    });
  });

  describe('POST /api/cartoes', () => {
    it('creates a new credit card', async () => {
      const user = await createTestUser();
      const token = makeToken(user.id);

      const res = await request(app)
        .post('/api/cartoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Nubank Ultravioleta',
          bandeira: 'mastercard',
          limite: 10000,
          dia_fechamento: 25,
          dia_vencimento: 5,
          cor: '#820ad1',
        });

      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Nubank Ultravioleta');
      expect(res.body.dia_fechamento).toBe(25);
      expect(res.body.dia_vencimento).toBe(5);
    });

    it('returns 400 for invalid dates or limit', async () => {
      const user = await createTestUser();
      const token = makeToken(user.id);

      const res = await request(app)
        .post('/api/cartoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Cartão Inválido',
          limite: -100,
          dia_fechamento: 35,
          dia_vencimento: 0,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Compras Parceladas e Faturas', () => {
    it('creates installment purchases correctly and calculates invoices', async () => {
      const user = await createTestUser();
      const token = makeToken(user.id);
      const cartao = await createTestCartao(user.id, {
        limite: 5000,
        dia_fechamento: 25,
        dia_vencimento: 5,
      });

      // Compra de 600 em 3x no dia 10/05/2026
      const txRes = await request(app)
        .post('/api/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: '2026-05-10',
          descricao: 'Smartphone',
          valor: 600,
          tipo: 'despesa',
          tipo_pagamento: 'credito',
          cartao_id: cartao.id,
          total_parcelas: 3,
        });

      expect(txRes.status).toBe(201);
      expect(txRes.body.total_parcelas).toBe(3);
      expect(txRes.body.compra_grupo_id).toBeTruthy();

      // Check all 3 transactions created
      const listTx = await request(app)
        .get(`/api/transacoes?cartaoId=${cartao.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(listTx.status).toBe(200);
      expect(listTx.body).toHaveLength(3);

      // Check invoices
      const faturasRes = await request(app)
        .get(`/api/cartoes/${cartao.id}/faturas`)
        .set('Authorization', `Bearer ${token}`);

      expect(faturasRes.status).toBe(200);
      expect(faturasRes.body).toHaveLength(3);
      // Each installment invoice has total of 200
      expect(faturasRes.body[0].total).toBe(200);
    });

    it('liquidates an invoice and frees up credit limit', async () => {
      const user = await createTestUser();
      const token = makeToken(user.id);
      const conta = await createTestConta(user.id);
      const cartao = await createTestCartao(user.id, {
        limite: 1000,
        dia_fechamento: 25,
        dia_vencimento: 5,
        conta_padrao_id: conta.id,
      });

      // Compra de 300 em 3x (100 por fatura) em 10/05/2026
      // Fatura 1: Junho/2026
      // Fatura 2: Julho/2026
      // Fatura 3: Agosto/2026
      await request(app)
        .post('/api/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: '2026-05-10',
          descricao: 'Curso',
          valor: 300,
          tipo: 'despesa',
          tipo_pagamento: 'credito',
          cartao_id: cartao.id,
          total_parcelas: 3,
        });

      // Limite antes do pagamento: 1000 - 300 = 700
      let cardRes = await request(app)
        .get(`/api/cartoes/${cartao.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(cardRes.body.limite_disponivel).toBe(700);

      // Pagar a fatura de Junho/2026 (fatura_mes: 6, fatura_ano: 2026)
      const payRes = await request(app)
        .post(`/api/cartoes/${cartao.id}/faturas/2026/6/pagar`)
        .set('Authorization', `Bearer ${token}`)
        .send({ conta_id: conta.id });

      expect(payRes.status).toBe(200);
      expect(payRes.body.transacoes_pagas).toBe(1);

      // Limite após pagamento da 1ª fatura: liberou 100 -> disponível 800!
      cardRes = await request(app)
        .get(`/api/cartoes/${cartao.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(cardRes.body.limite_disponivel).toBe(800);
      expect(cardRes.body.limite_comprometido).toBe(200);
    });

    it('deletes all installments when mode=all is used', async () => {
      const user = await createTestUser();
      const token = makeToken(user.id);
      const cartao = await createTestCartao(user.id);

      const txRes = await request(app)
        .post('/api/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          data: '2026-05-10',
          descricao: 'Passagem',
          valor: 500,
          tipo: 'despesa',
          tipo_pagamento: 'credito',
          cartao_id: cartao.id,
          total_parcelas: 5,
        });

      const firstId = txRes.body.id;

      // Delete with mode=all
      const delRes = await request(app)
        .delete(`/api/transacoes/${firstId}?mode=all`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(200);

      const listRes = await request(app)
        .get(`/api/transacoes?cartaoId=${cartao.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.body).toHaveLength(0);
    });
  });
});

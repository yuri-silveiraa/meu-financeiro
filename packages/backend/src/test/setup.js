import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pool;

export function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function initTestDatabase() {
  const p = getPool();

  // Garante tabela cartoes primeiro se já não existir
  await p.query(`
    CREATE TABLE IF NOT EXISTS cartoes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      bandeira TEXT,
      limite NUMERIC(12,2) NOT NULL DEFAULT 0,
      dia_fechamento INTEGER NOT NULL CHECK(dia_fechamento >= 1 AND dia_fechamento <= 31),
      dia_vencimento INTEGER NOT NULL CHECK(dia_vencimento >= 1 AND dia_vencimento <= 31),
      conta_padrao_id INTEGER REFERENCES contas(id) ON DELETE SET NULL,
      cor TEXT DEFAULT '#6366f1',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch(() => {});

  const migrations = [
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ',
    'ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS cartao_id INTEGER REFERENCES cartoes(id) ON DELETE SET NULL',
    'ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1',
    'ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS fatura_mes INTEGER',
    'ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS fatura_ano INTEGER',
    'ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS compra_grupo_id TEXT',
    'ALTER TABLE gastos_fixos ADD COLUMN IF NOT EXISTS cartao_id INTEGER REFERENCES cartoes(id) ON DELETE SET NULL',
  ];
  for (const sql of migrations) {
    await p.query(sql).catch(() => {});
  }

  const schemaPath = join(__dirname, '..', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  await p.query(schema);
}

export async function resetDatabase() {
  const p = getPool();
  await p.query('TRUNCATE TABLE transacoes, metas, gastos_fixos, categorias, contas, cartoes, users RESTART IDENTITY CASCADE');
}

export async function createTestUser(overrides = {}) {
  const p = getPool();
  const googleId = overrides.google_id || `test-google-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const name = overrides.name || 'Test User';

  const result = await p.query(
    'INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [googleId, email, name, overrides.avatar_url || null]
  );
  return result.rows[0];
}

export async function createTestCategory(userId, overrides = {}) {
  const p = getPool();
  const result = await p.query(
    'INSERT INTO categorias (user_id, nome, cor, icone) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, overrides.nome || 'Test Category', overrides.cor || '#3b82f6', overrides.icone || 'folder']
  );
  return result.rows[0];
}

export async function createTestConta(userId, overrides = {}) {
  const p = getPool();
  const result = await p.query(
    'INSERT INTO contas (user_id, nome, banco, tipo_conta, saldo_inicial) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, overrides.nome || 'Test Account', overrides.banco || 'Banco Teste', overrides.tipo_conta || 'corrente', overrides.saldo_inicial || 0]
  );
  return result.rows[0];
}

export async function createTestCartao(userId, overrides = {}) {
  const p = getPool();
  const result = await p.query(
    `INSERT INTO cartoes (user_id, nome, bandeira, limite, dia_fechamento, dia_vencimento, conta_padrao_id, cor)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      userId,
      overrides.nome || 'Cartão Teste',
      overrides.bandeira || 'mastercard',
      overrides.limite || 1000.00,
      overrides.dia_fechamento || 25,
      overrides.dia_vencimento || 5,
      overrides.conta_padrao_id || null,
      overrides.cor || '#6366f1',
    ]
  );
  return result.rows[0];
}

export async function createTestTransacao(userId, overrides = {}) {
  const p = getPool();
  const result = await p.query(
    `INSERT INTO transacoes (user_id, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      userId,
      overrides.data || new Date().toISOString().split('T')[0],
      overrides.descricao || 'Test Transaction',
      overrides.valor || 100.00,
      overrides.tipo || 'despesa',
      overrides.tipo_pagamento || 'pix',
      overrides.categoria_id || null,
      overrides.conta_id || null,
      overrides.pago || false,
    ]
  );
  return result.rows[0];
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

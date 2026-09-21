import dotenv from 'dotenv';
import pool from './config/database.js';
import { createApp } from './app.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET não definido. Saindo.');
  process.exit(1);
}

if (!process.env.BOT_API_KEY) {
  console.error('FATAL: BOT_API_KEY não definido. Saindo.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;

// Inicializar banco de dados
async function initDatabase() {
  try {
    // Garante tabela cartoes primeiro se já não existir
    await pool.query(`
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

    // Migrações simples
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
      await pool.query(sql).catch(() => {});
    }

    const schemaPath = join(__dirname, 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    await pool.query(schema);

    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('FATAL: Erro ao inicializar banco de dados:', error.message);
    process.exit(1);
  }
}

// Iniciar servidor
const app = createApp();
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});

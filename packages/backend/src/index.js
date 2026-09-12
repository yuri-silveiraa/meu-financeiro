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
    const schemaPath = join(__dirname, 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    await pool.query(schema);

    // Migrações simples
    const migrations = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ',
    ];
    for (const sql of migrations) {
      await pool.query(sql).catch(() => {});
    }

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

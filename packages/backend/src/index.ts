import dotenv from 'dotenv';
import { prisma } from './config/prisma.js';
import { createApp } from './app.js';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: Variável de ambiente JWT_SECRET não definida no backend. Verifique o arquivo .env.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT) || 3001;

async function initDatabase(): Promise<void> {
  // Conectar Prisma ao banco
  await prisma.$connect();

  // Executa schema.sql para garantir tabelas e índices se ainda não existirem
  const candidates = [
    join(__dirname, 'db', 'schema.sql'),
    join(__dirname, '..', 'src', 'db', 'schema.sql'),
    join(__dirname, '..', 'db', 'schema.sql'),
  ];
  const schemaPath = candidates.find((p) => existsSync(p));

  if (schemaPath) {
    try {
      const schema = readFileSync(schemaPath, 'utf8');
      const statements = schema
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement).catch(() => {});
      }
    } catch (err: any) {
      console.warn('Aviso ao carregar schema.sql:', err.message);
    }
  } else {
    console.warn('schema.sql não localizado nos caminhos esperados, prosseguindo com Prisma');
  }

  // Garantir colunas adicionais
  await prisma.$executeRawUnsafe(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_ip TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
  `).catch(() => {});

  console.log('Banco de dados inicializado com sucesso via Prisma');
}

async function initDatabaseWithRetry(maxRetries = 5, delay = 2000): Promise<void> {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await initDatabase();
      return;
    } catch (error: any) {
      console.warn(`Tentativa ${i}/${maxRetries} de inicialização do banco falhou: ${error.message}`);
      if (i === maxRetries) {
        console.error('FATAL: Não foi possível inicializar o banco de dados após múltiplas tentativas:', error.message);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

const app = createApp();

initDatabaseWithRetry().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});

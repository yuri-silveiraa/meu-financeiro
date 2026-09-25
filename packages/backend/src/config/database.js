import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  Boolean(
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('sslmode=require') ||
     process.env.DATABASE_URL.includes('ssl=true'))
  );

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;

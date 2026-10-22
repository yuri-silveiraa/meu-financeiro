import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes, authRoutes } from './routes/index.js';
import { errorHandler } from './errors/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // Rate limiting geral
  const generalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  });
  app.use(generalLimiter);

  // Rate limiting para auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  });

  // CORS
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:8080',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  // Rotas de autenticação
  app.use('/auth', authLimiter, authRoutes);

  // Demais rotas da API
  app.use(routes);

  // Rota de saúde
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

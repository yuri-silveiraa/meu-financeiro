import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import transacoesRoutes from './routes/transacoes.js';
import categoriasRoutes from './routes/categorias.js';
import contasRoutes from './routes/contas.js';
import metasRoutes from './routes/metas.js';
import gastosFixosRoutes from './routes/gastosFixos.js';
import estatisticasRoutes from './routes/estatisticas.js';
import previsoesRoutes from './routes/previsoes.js';
import botRoutes from './routes/bot.js';
import whatsappRoutes from './routes/whatsapp.js';
import cartoesRoutes from './routes/cartoes.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // Rate limiting geral
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  });
  app.use(generalLimiter);

  // Rate limiting mais restritivo para auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  });

  // CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // Rotas
  app.use('/auth', authLimiter, authRoutes);
  app.use('/api/transacoes', transacoesRoutes);
  app.use('/api/categorias', categoriasRoutes);
  app.use('/api/contas', contasRoutes);
  app.use('/api/metas', metasRoutes);
  app.use('/api/gastos-fixos', gastosFixosRoutes);
  app.use('/api/estatisticas', estatisticasRoutes);
  app.use('/api/previsoes', previsoesRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/cartoes', cartoesRoutes);
  app.use('/bot', botRoutes);

  // Rota de saúde
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 catch-all
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  // Error handler global
  app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err.message);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor'
        : err.message
    });
  });

  return app;
}

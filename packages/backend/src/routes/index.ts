import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoriasRoutes from './categorias.routes.js';
import contasRoutes from './contas.routes.js';
import cartoesRoutes from './cartoes.routes.js';
import gastosFixosRoutes from './gastosFixos.routes.js';
import transacoesRoutes from './transacoes.routes.js';
import metasRoutes from './metas.routes.js';
import estatisticasRoutes from './estatisticas.routes.js';
import previsoesRoutes from './previsoes.routes.js';
import privacyRoutes from './privacy.routes.js';

const routes = Router();

routes.use('/api/categorias', categoriasRoutes);
routes.use('/api/contas', contasRoutes);
routes.use('/api/cartoes', cartoesRoutes);
routes.use('/api/gastos-fixos', gastosFixosRoutes);
routes.use('/api/transacoes', transacoesRoutes);
routes.use('/api/metas', metasRoutes);
routes.use('/api/estatisticas', estatisticasRoutes);
routes.use('/api/previsoes', previsoesRoutes);
routes.use('/api/privacy', privacyRoutes);

export { routes, authRoutes };

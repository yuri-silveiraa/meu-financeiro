import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  estatisticasMensaisQuerySchema,
  cartoesAnualQuerySchema,
} from '../schemas/estatistica.schema.js';
import { PrismaEstatisticasRepository } from '../repositories/PrismaEstatisticasRepository.js';
import { PrismaCartoesRepository } from '../repositories/PrismaCartoesRepository.js';
import { EstatisticasService } from '../services/EstatisticasService.js';
import { EstatisticasController } from '../controllers/EstatisticasController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const estatisticasRepository = new PrismaEstatisticasRepository();
const cartoesRepository = new PrismaCartoesRepository();
const estatisticasService = new EstatisticasService(estatisticasRepository, cartoesRepository);
const estatisticasController = new EstatisticasController(estatisticasService);

// Endpoints
router.get(
  '/',
  validate({ query: estatisticasMensaisQuerySchema }),
  asyncHandler(estatisticasController.getMensais)
);
router.get(
  '/cartoes-anual',
  validate({ query: cartoesAnualQuerySchema }),
  asyncHandler(estatisticasController.getCartoesAnual)
);

export default router;

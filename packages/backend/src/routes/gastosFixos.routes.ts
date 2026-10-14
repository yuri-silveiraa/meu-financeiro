import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { createGastoFixoSchema, updateGastoFixoSchema } from '../schemas/gastoFixo.schema.js';
import { PrismaGastosFixosRepository } from '../repositories/PrismaGastosFixosRepository.js';
import { GastosFixosService } from '../services/GastosFixosService.js';
import { GastosFixosController } from '../controllers/GastosFixosController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const gastosFixosRepository = new PrismaGastosFixosRepository();
const gastosFixosService = new GastosFixosService(gastosFixosRepository);
const gastosFixosController = new GastosFixosController(gastosFixosService);

// Endpoints
router.get('/', asyncHandler(gastosFixosController.list));
router.post(
  '/',
  validate({ body: createGastoFixoSchema }),
  asyncHandler(gastosFixosController.create)
);
router.get('/:id', asyncHandler(gastosFixosController.findById));
router.put(
  '/:id',
  validate({ body: updateGastoFixoSchema }),
  asyncHandler(gastosFixosController.update)
);
router.delete('/:id', asyncHandler(gastosFixosController.delete));

export default router;

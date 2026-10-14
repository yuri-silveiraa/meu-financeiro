import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { createContaSchema, updateContaSchema } from '../schemas/conta.schema.js';
import { PrismaContasRepository } from '../repositories/PrismaContasRepository.js';
import { ContasService } from '../services/ContasService.js';
import { ContasController } from '../controllers/ContasController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const contasRepository = new PrismaContasRepository();
const contasService = new ContasService(contasRepository);
const contasController = new ContasController(contasService);

// Endpoints
router.get('/', asyncHandler(contasController.list));
router.post(
  '/',
  validate({ body: createContaSchema }),
  asyncHandler(contasController.create)
);
router.put(
  '/:id',
  validate({ body: updateContaSchema }),
  asyncHandler(contasController.update)
);
router.delete('/:id', asyncHandler(contasController.delete));

export default router;

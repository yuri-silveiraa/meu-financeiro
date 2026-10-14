import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  createCartaoSchema,
  updateCartaoSchema,
  pagarFaturaSchema,
} from '../schemas/cartao.schema.js';
import { PrismaCartoesRepository } from '../repositories/PrismaCartoesRepository.js';
import { CartoesService } from '../services/CartoesService.js';
import { CartoesController } from '../controllers/CartoesController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const cartoesRepository = new PrismaCartoesRepository();
const cartoesService = new CartoesService(cartoesRepository);
const cartoesController = new CartoesController(cartoesService);

// Endpoints
router.get('/', asyncHandler(cartoesController.list));
router.post(
  '/',
  validate({ body: createCartaoSchema }),
  asyncHandler(cartoesController.create)
);
router.get('/:id', asyncHandler(cartoesController.findById));
router.put(
  '/:id',
  validate({ body: updateCartaoSchema }),
  asyncHandler(cartoesController.update)
);
router.delete('/:id', asyncHandler(cartoesController.delete));

// Endpoints de Faturas
router.get('/:id/faturas', asyncHandler(cartoesController.listFaturas));
router.get('/:id/faturas/:ano/:mes', asyncHandler(cartoesController.getFaturaDetalhada));
router.post(
  '/:id/faturas/:ano/:mes/pagar',
  validate({ body: pagarFaturaSchema }),
  asyncHandler(cartoesController.pagarFatura)
);

export default router;

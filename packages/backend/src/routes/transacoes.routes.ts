import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  transacaoQuerySchema,
  createTransacaoSchema,
  updateTransacaoSchema,
} from '../schemas/transacao.schema.js';
import { PrismaTransacoesRepository } from '../repositories/PrismaTransacoesRepository.js';
import { PrismaCartoesRepository } from '../repositories/PrismaCartoesRepository.js';
import { TransacoesService } from '../services/TransacoesService.js';
import { TransacoesController } from '../controllers/TransacoesController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const transacoesRepository = new PrismaTransacoesRepository();
const cartoesRepository = new PrismaCartoesRepository();
const transacoesService = new TransacoesService(transacoesRepository, cartoesRepository);
const transacoesController = new TransacoesController(transacoesService);

// Endpoints
router.get(
  '/',
  validate({ query: transacaoQuerySchema }),
  asyncHandler(transacoesController.list)
);
router.post(
  '/',
  validate({ body: createTransacaoSchema }),
  asyncHandler(transacoesController.create)
);
router.get('/:id', asyncHandler(transacoesController.findById));
router.put(
  '/:id',
  validate({ body: updateTransacaoSchema }),
  asyncHandler(transacoesController.update)
);
router.delete('/:id', asyncHandler(transacoesController.delete));
router.patch('/:id/pago', asyncHandler(transacoesController.togglePago));

export default router;

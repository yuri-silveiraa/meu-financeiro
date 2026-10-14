import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { createMetaSchema, updateMetaSchema } from '../schemas/meta.schema.js';
import { PrismaMetasRepository } from '../repositories/PrismaMetasRepository.js';
import { MetasService } from '../services/MetasService.js';
import { MetasController } from '../controllers/MetasController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const metasRepository = new PrismaMetasRepository();
const metasService = new MetasService(metasRepository);
const metasController = new MetasController(metasService);

// Endpoints
router.get('/', asyncHandler(metasController.list));
router.post(
  '/',
  validate({ body: createMetaSchema }),
  asyncHandler(metasController.create)
);
router.put(
  '/:id',
  validate({ body: updateMetaSchema }),
  asyncHandler(metasController.update)
);
router.delete('/:id', asyncHandler(metasController.delete));

export default router;

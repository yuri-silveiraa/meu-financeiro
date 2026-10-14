import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { createCategoriaSchema, updateCategoriaSchema } from '../schemas/categoria.schema.js';
import { PrismaCategoriasRepository } from '../repositories/PrismaCategoriasRepository.js';
import { CategoriasService } from '../services/CategoriasService.js';
import { CategoriasController } from '../controllers/CategoriasController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const categoriasRepository = new PrismaCategoriasRepository();
const categoriasService = new CategoriasService(categoriasRepository);
const categoriasController = new CategoriasController(categoriasService);

// Endpoints
router.get('/', asyncHandler(categoriasController.list));
router.post(
  '/',
  validate({ body: createCategoriaSchema }),
  asyncHandler(categoriasController.create)
);
router.put(
  '/:id',
  validate({ body: updateCategoriaSchema }),
  asyncHandler(categoriasController.update)
);
router.delete('/:id', asyncHandler(categoriasController.delete));

export default router;

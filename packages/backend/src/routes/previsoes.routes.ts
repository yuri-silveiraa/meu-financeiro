import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { PrismaGastosFixosRepository } from '../repositories/PrismaGastosFixosRepository.js';
import { PrevisoesService } from '../services/PrevisoesService.js';
import { PrevisoesController } from '../controllers/PrevisoesController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const gastosFixosRepository = new PrismaGastosFixosRepository();
const previsoesService = new PrevisoesService(gastosFixosRepository);
const previsoesController = new PrevisoesController(previsoesService);

// Endpoints
router.get('/', asyncHandler(previsoesController.getPrevisoes));

export default router;

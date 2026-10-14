import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { PrivacyService } from '../services/PrivacyService.js';
import { PrivacyController } from '../controllers/PrivacyController.js';

const router = Router();
router.use(authMiddleware);

// --- Composition Root: Injeção de dependências explícita ---
const privacyService = new PrivacyService();
const privacyController = new PrivacyController(privacyService);

// Endpoints
router.get('/my-data', asyncHandler(privacyController.exportMyData));
router.delete('/delete-account', asyncHandler(privacyController.deleteAccount));

export default router;

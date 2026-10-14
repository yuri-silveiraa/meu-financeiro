import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { PrismaUsersRepository } from '../repositories/PrismaUsersRepository.js';
import { AuthService } from '../services/AuthService.js';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

// --- Composition Root: Injeção de dependências explícita ---
const usersRepository = new PrismaUsersRepository();
const authService = new AuthService(usersRepository);
const authController = new AuthController(authService);

// Endpoints
router.get('/google', authController.googleRedirect);
router.get('/google/callback', asyncHandler(authController.googleCallback));
router.post('/google', asyncHandler(authController.googleLogin));
router.get('/me', authMiddleware, asyncHandler(authController.getMe));
router.post('/refresh', asyncHandler(authController.refreshToken));

export default router;

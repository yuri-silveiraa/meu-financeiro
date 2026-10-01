import { Router } from 'express';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Armazenamento temporário de códigos de vinculação (em memória)
const pendingLinks = new Map();

// Gerar código de vinculação (JWT auth — usado pelo frontend)
router.post('/vincular', async (req, res) => {
  return res.status(503).json({
    error: 'A integração com o WhatsApp Bot está em desenvolvimento e estará disponível em breve.'
  });
});


export default router;
export { pendingLinks };

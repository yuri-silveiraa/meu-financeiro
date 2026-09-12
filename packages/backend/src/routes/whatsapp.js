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
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber obrigatório' });
    }
    if (!/^\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Formato de telefone inválido' });
    }

    const code = String(crypto.randomInt(100000, 999999));

    pendingLinks.set(phoneNumber, {
      code,
      userId: req.userId,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    // Limpar códigos expirados a cada chamada
    for (const [key, val] of pendingLinks) {
      if (Date.now() > val.expiresAt) pendingLinks.delete(key);
    }

    res.json({ code, expiresIn: '15 minutos' });
  } catch (error) {
    console.error('Erro ao gerar código:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
export { pendingLinks };

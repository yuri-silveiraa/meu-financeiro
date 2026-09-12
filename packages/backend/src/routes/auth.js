import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { googleClient, jwtSecret } from '../config/auth.js';
import pool from '../config/database.js';

const router = Router();

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Credential não fornecido' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [googleId, email, name, picture]
      );
    }

    const user = result.rows[0];

    // Categorias padrão para novo usuário (em transaction)
    const catCheck = await pool.query('SELECT COUNT(*) FROM categorias WHERE user_id = $1', [user.id]);
    if (parseInt(catCheck.rows[0].count) === 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const defaultCategories = [
          { nome: 'Alimentacao', cor: '#22c55e', icone: 'utensils' },
          { nome: 'Transporte', cor: '#3b82f6', icone: 'car' },
          { nome: 'Moradia', cor: '#8b5cf6', icone: 'home' },
          { nome: 'Lazer', cor: '#f59e0b', icone: 'gamepad-2' },
          { nome: 'Saude', cor: '#ef4444', icone: 'heart-pulse' },
          { nome: 'Educacao', cor: '#06b6d4', icone: 'graduation-cap' },
          { nome: 'Outros', cor: '#6b7280', icone: 'folder' },
        ];

        for (const cat of defaultCategories) {
          await client.query(
            'INSERT INTO categorias (user_id, nome, cor, icone) VALUES ($1, $2, $3, $4)',
            [user.id, cat.nome, cat.cor, cat.icone]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Erro na autenticação Google:', error);
    res.status(500).json({ error: 'Erro na autenticação' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const result = await pool.query(
      'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

router.post('/refresh', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret, { ignoreExpiration: true });

    // Verificar se o token não expirou há mais de 7 dias
    const maxAge = decoded.iat + 37 * 24 * 60 * 60;
    if (Math.floor(Date.now() / 1000) > maxAge) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    const result = await pool.query(
      'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const newToken = jwt.sign({ userId: decoded.userId }, jwtSecret, { expiresIn: '30d' });

    res.json({
      token: newToken,
      user: result.rows[0],
    });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;

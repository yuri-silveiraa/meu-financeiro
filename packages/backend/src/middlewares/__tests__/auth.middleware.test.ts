import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../auth.middleware.js';

describe('authMiddleware', () => {
  const secret = 'test-jwt-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
  });

  function mockReqRes(authHeader?: string) {
    const req = {
      headers: {
        authorization: authHeader,
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  }

  it('retorna 401 quando o cabeçalho Authorization não existe', () => {
    const { req, res, next } = mockReqRes(undefined);
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 quando o cabeçalho não começa com Bearer', () => {
    const { req, res, next } = mockReqRes('Basic 123456');
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 para token inválido ou corrompido', () => {
    const { req, res, next } = mockReqRes('Bearer invalid-token');
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 para token expirado', () => {
    const expiredToken = jwt.sign({ userId: 1 }, secret, { expiresIn: '-1s' });
    const { req, res, next } = mockReqRes(`Bearer ${expiredToken}`);
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('injeta req.userId e invoca next() para token válido', () => {
    const validToken = jwt.sign({ userId: 42 }, secret, { expiresIn: '1h' });
    const { req, res, next } = mockReqRes(`Bearer ${validToken}`);
    authMiddleware(req, res, next);

    expect(req.userId).toBe(42);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

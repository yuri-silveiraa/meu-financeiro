import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate.middleware.js';

describe('validate middleware (Zod)', () => {
  const schema = {
    body: z.object({
      nome: z.string().min(2, 'Nome muito curto'),
      valor: z.number().positive('Valor deve ser positivo'),
    }),
  };

  it('chama next() quando os dados do body são válidos', async () => {
    const req = {
      body: { nome: 'Salário', valor: 5000 },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    const middleware = validate(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna 400 com lista de issues quando o payload for inválido', async () => {
    const req = {
      body: { nome: 'A', valor: -10 },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    const middleware = validate(schema);
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Dados inválidos',
        issues: expect.arrayContaining([
          expect.objectContaining({ field: 'nome', message: 'Nome muito curto' }),
          expect.objectContaining({ field: 'valor', message: 'Valor deve ser positivo' }),
        ]),
      })
    );
  });
});

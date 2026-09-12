import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

function mockReqRes(authHeader) {
  const req = {
    headers: authHeader !== undefined ? { authorization: authHeader } : {},
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('authMiddleware', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('returns 401 when no authorization header', () => {
    const { req, res, next } = mockReqRes(undefined);
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/token/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header does not start with Bearer', () => {
    const { req, res, next } = mockReqRes('Basic abc123');
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', () => {
    const { req, res, next } = mockReqRes('Bearer invalid-token');
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for expired token', () => {
    const token = jwt.sign({ userId: 1 }, JWT_SECRET, { expiresIn: '0s' });
    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.userId and calls next for valid token', () => {
    const token = createToken(42);
    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(42);
  });

  it('returns 401 when Bearer prefix is missing space', () => {
    const token = createToken(1);
    const { req, res, next } = mockReqRes(`Bearer${token}`);
    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

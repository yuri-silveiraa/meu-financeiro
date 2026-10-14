import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../auth.routes.js';
import { getRedirectUri } from '../../services/AuthService.js';

describe('Google Auth Redirect Flow', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  describe('getRedirectUri', () => {
    const originalEnv = process.env.GOOGLE_REDIRECT_URI;

    afterEach(() => {
      if (originalEnv) {
        process.env.GOOGLE_REDIRECT_URI = originalEnv;
      } else {
        delete process.env.GOOGLE_REDIRECT_URI;
      }
    });

    it('prioritizes process.env.GOOGLE_REDIRECT_URI when set', () => {
      process.env.GOOGLE_REDIRECT_URI = 'https://custom.domain.com/callback';
      const mockReq = { headers: {}, get: () => 'localhost:3001', protocol: 'http' } as any;
      expect(getRedirectUri(mockReq)).toBe('https://custom.domain.com/callback');
    });

    it('derives URI from x-forwarded headers when behind a reverse proxy', () => {
      delete process.env.GOOGLE_REDIRECT_URI;
      const mockReq = {
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'financeiro.meudominio.com',
        },
        get: () => 'localhost:3001',
        protocol: 'http',
      } as any;
      expect(getRedirectUri(mockReq)).toBe('https://financeiro.meudominio.com/auth/google/callback');
    });

    it('fallbacks to protocol and host header', () => {
      delete process.env.GOOGLE_REDIRECT_URI;
      const mockReq = {
        headers: {},
        get: (h: string) => (h === 'host' ? 'localhost:3001' : null),
        protocol: 'http',
      } as any;
      expect(getRedirectUri(mockReq)).toBe('http://localhost:3001/auth/google/callback');
    });
  });

  describe('GET /auth/google', () => {
    it('redirects 302 to Google OAuth authorization URL', async () => {
      const res = await request(app).get('/auth/google?consentAccepted=true');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(res.headers.location).toContain('response_type=code');
      expect(res.headers.location).toContain('state=');
    });
  });

  describe('GET /auth/google/callback', () => {
    it('redirects to /login?error=... when error query param is present', async () => {
      const res = await request(app).get('/auth/google/callback?error=access_denied');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/login?error=access_denied');
    });

    it('redirects to /login?error=... when code is missing', async () => {
      const res = await request(app).get('/auth/google/callback');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/login?error=');
    });
  });
});

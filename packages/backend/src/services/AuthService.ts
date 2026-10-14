import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { googleClient, jwtSecret } from '../config/auth.js';
import type { IUsersRepository } from '../types/repositories/IUsersRepository.js';
import type {
  IAuthService,
  FindOrCreateGoogleUserParams,
} from '../types/services/IAuthService.js';
import type { AuthResponseDTO, AuthUserDTO, GoogleLoginDTO } from '../types/dtos/auth.dto.js';
import { UserMapper } from '../mappers/UserMapper.js';
import { AppError } from '../errors/AppError.js';
import type { User } from '@prisma/client';

export function getRedirectUri(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}/auth/google/callback`;
}

export class AuthService implements IAuthService {
  constructor(private readonly userRepo: IUsersRepository) {}

  async findOrCreateGoogleUser(params: FindOrCreateGoogleUserParams): Promise<User> {
    let user = await this.userRepo.findByGoogleId(params.googleId);

    if (!user) {
      if (!params.consentAccepted) {
        throw new AppError('É necessário aceitar os Termos de Uso e Política de Privacidade.', 400);
      }

      user = await this.userRepo.create({
        googleId: params.googleId,
        email: params.email,
        name: params.name ?? null,
        avatarUrl: params.picture ?? null,
        consentAcceptedAt: new Date(),
        consentIp: params.clientIp ?? null,
      });

      await this.userRepo.createDefaultCategories(user.id);
    } else if (params.consentAccepted && !user.consentAcceptedAt && params.clientIp) {
      await this.userRepo.updateConsent(user.id, params.clientIp);
    }

    return user;
  }

  getAuthUrl(req: Request, consentAccepted: boolean): string {
    const redirectUri = getRedirectUri(req);
    const stateData = {
      consentAccepted,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
      redirect_uri: redirectUri,
      state,
    });
  }

  async handleGoogleCallback(req: Request): Promise<string> {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    if (error) {
      return `${frontendUrl}/login?error=${encodeURIComponent(error)}`;
    }

    if (!code) {
      return `${frontendUrl}/login?error=${encodeURIComponent('Código de autorização não fornecido')}`;
    }

    let consentAccepted = false;
    if (state) {
      try {
        const parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        consentAccepted = Boolean(parsedState.consentAccepted);
      } catch (e: any) {
        console.warn('Não foi possível decodificar state:', e.message);
      }
    }

    const redirectUri = getRedirectUri(req);
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: redirectUri,
    });

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return `${frontendUrl}/login?error=${encodeURIComponent('Token do Google inválido')}`;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;

    const user = await this.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      consentAccepted,
      clientIp,
    });

    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '30d' });
    return `${frontendUrl}/login?token=${token}`;
  }

  async loginWithCredential(data: GoogleLoginDTO, clientIp?: string): Promise<AuthResponseDTO> {
    if (!data.credential) {
      throw new AppError('Credential não fornecido', 400);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: data.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new AppError('Token do Google inválido', 400);
    }

    const user = await this.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      consentAccepted: Boolean(data.consentAccepted),
      clientIp,
    });

    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '30d' });

    return {
      token,
      user: UserMapper.toDTO(user),
    };
  }

  async getMe(userId: number): Promise<AuthUserDTO> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    return UserMapper.toDTO(user);
  }

  async refreshToken(token: string): Promise<AuthResponseDTO> {
    try {
      const decoded = jwt.verify(token, jwtSecret, { ignoreExpiration: true }) as any;
      const maxAge = decoded.iat + 37 * 24 * 60 * 60;

      if (Math.floor(Date.now() / 1000) > maxAge) {
        throw new AppError('Sessão expirada. Faça login novamente.', 401);
      }

      const user = await this.userRepo.findById(decoded.userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      const newToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '30d' });

      return {
        token: newToken,
        user: UserMapper.toDTO(user),
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Token inválido', 401);
    }
  }
}

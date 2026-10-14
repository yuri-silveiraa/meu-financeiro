import type { Request } from 'express';
import type { AuthResponseDTO, AuthUserDTO, GoogleLoginDTO } from '../dtos/auth.dto.js';
import type { User } from '@prisma/client';

export interface FindOrCreateGoogleUserParams {
  googleId: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  consentAccepted?: boolean;
  clientIp?: string;
}

export interface IAuthService {
  findOrCreateGoogleUser(params: FindOrCreateGoogleUserParams): Promise<User>;
  getAuthUrl(req: Request, consentAccepted: boolean): string;
  handleGoogleCallback(req: Request): Promise<string>;
  loginWithCredential(data: GoogleLoginDTO, clientIp?: string): Promise<AuthResponseDTO>;
  getMe(userId: number): Promise<AuthUserDTO>;
  refreshToken(token: string): Promise<AuthResponseDTO>;
}

import type { Request, Response } from 'express';
import type { IAuthService } from '../types/services/IAuthService.js';
import type { AuthResponseDTO, AuthUserDTO } from '../types/dtos/auth.dto.js';

export class AuthController {
  constructor(private readonly service: IAuthService) {}

  googleRedirect = (req: Request, res: Response): void => {
    const consentAccepted = req.query.consentAccepted === 'true';
    const authUrl = this.service.getAuthUrl(req, consentAccepted);
    res.redirect(authUrl);
  };

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    const targetUrl = await this.service.handleGoogleCallback(req);
    res.redirect(targetUrl);
  };

  googleLogin = async (req: Request, res: Response): Promise<Response<AuthResponseDTO>> => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const result = await this.service.loginWithCredential(req.body, clientIp);
    return res.json(result);
  };

  getMe = async (req: Request, res: Response): Promise<Response<{ user: AuthUserDTO }>> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' } as any);
    }
    const user = await this.service.getMe(req.userId!);
    return res.json({ user });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response<AuthResponseDTO>> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' } as any);
    }
    const token = authHeader.split(' ')[1];
    const result = await this.service.refreshToken(token);
    return res.json(result);
  };
}

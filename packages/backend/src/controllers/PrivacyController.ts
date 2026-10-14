import type { Request, Response } from 'express';
import type { IPrivacyService } from '../types/services/IPrivacyService.js';

export class PrivacyController {
  constructor(private readonly service: IPrivacyService) {}

  exportMyData = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.service.exportMyData(req.userId!);
    return res.json(data);
  };

  deleteAccount = async (req: Request, res: Response): Promise<Response> => {
    await this.service.deleteAccount(req.userId!);
    return res.json({ message: 'Conta e todos os dados pessoais foram excluídos permanentemente.' });
  };
}

import { prisma } from '../config/prisma.js';
import type { IPrivacyService } from '../types/services/IPrivacyService.js';
import { AppError } from '../errors/AppError.js';

export class PrivacyService implements IPrivacyService {
  async exportMyData(userId: number): Promise<any> {
    const [user, transacoes, categorias, contas, cartoes, metas, gastosFixos] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          whatsappNumber: true,
          createdAt: true,
          consentAcceptedAt: true,
        },
      }),
      prisma.transacao.findMany({
        where: { userId },
        orderBy: { data: 'desc' },
      }),
      prisma.categoria.findMany({
        where: { userId },
      }),
      prisma.conta.findMany({
        where: { userId },
      }),
      prisma.cartao.findMany({
        where: { userId },
      }),
      prisma.meta.findMany({
        where: { userId },
      }),
      prisma.gastoFixo.findMany({
        where: { userId },
      }),
    ]);

    return {
      exportadoEm: new Date().toISOString(),
      usuario: user || null,
      transacoes,
      categorias,
      contas,
      cartoes,
      metas,
      gastosFixos,
    };
  }

  async deleteAccount(userId: number): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
    } catch (_err) {
      throw new AppError('Usuário não encontrado', 404);
    }
  }
}

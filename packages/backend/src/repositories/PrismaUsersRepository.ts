import { prisma } from '../config/prisma.js';
import type { IUsersRepository, CreateUserData } from '../types/repositories/IUsersRepository.js';
import type { User } from '@prisma/client';

export class PrismaUsersRepository implements IUsersRepository {
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        googleId: data.googleId,
        email: data.email,
        name: data.name ?? null,
        avatarUrl: data.avatarUrl ?? null,
        consentAcceptedAt: data.consentAcceptedAt ?? null,
        consentIp: data.consentIp ?? null,
      },
    });
  }

  async updateConsent(id: number, consentIp: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        consentAcceptedAt: new Date(),
        consentIp,
      },
    });
  }

  async createDefaultCategories(userId: number): Promise<void> {
    const count = await prisma.categoria.count({
      where: { userId },
    });

    if (count === 0) {
      const defaultCategories = [
        { nome: 'Alimentacao', cor: '#22c55e', icone: 'utensils' },
        { nome: 'Transporte', cor: '#3b82f6', icone: 'car' },
        { nome: 'Moradia', cor: '#8b5cf6', icone: 'home' },
        { nome: 'Lazer', cor: '#f59e0b', icone: 'gamepad-2' },
        { nome: 'Saude', cor: '#ef4444', icone: 'heart-pulse' },
        { nome: 'Educacao', cor: '#06b6d4', icone: 'graduation-cap' },
        { nome: 'Outros', cor: '#6b7280', icone: 'folder' },
      ];

      await prisma.categoria.createMany({
        data: defaultCategories.map((c) => ({
          userId,
          nome: c.nome,
          cor: c.cor,
          icone: c.icone,
        })),
      });
    }
  }

  async deleteUser(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}

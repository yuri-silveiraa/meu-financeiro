import type { User } from '@prisma/client';

export interface CreateUserData {
  googleId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  consentAcceptedAt?: Date | null;
  consentIp?: string | null;
}

export interface IUsersRepository {
  findById(id: number): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updateConsent(id: number, consentIp: string): Promise<void>;
  createDefaultCategories(userId: number): Promise<void>;
  deleteUser(id: number): Promise<void>;
}

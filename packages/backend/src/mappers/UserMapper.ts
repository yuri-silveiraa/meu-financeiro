import type { User } from '@prisma/client';
import type { AuthUserDTO } from '../types/dtos/auth.dto.js';

export class UserMapper {
  static toDTO(user: User): AuthUserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl,
    };
  }
}

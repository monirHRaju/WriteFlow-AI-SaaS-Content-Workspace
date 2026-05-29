import { prisma } from '../../config/prisma';
import { Prisma, User } from '@prisma/client';

export class AuthRepository {
  // Persist new user registration
  static async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  // Retrieve user by unique email
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  // Retrieve user by primary UUID key
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}

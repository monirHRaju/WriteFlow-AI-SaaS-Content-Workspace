import { prisma } from '../../config/prisma';
import { User, Prisma } from '@prisma/client';

export class UsersRepository {
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static async updateById(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  static async countDocuments(userId: string): Promise<number> {
    return prisma.document.count({
      where: { userId, status: { not: 'ARCHIVED' } },
    });
  }

  static async sumDocumentTokens(userId: string): Promise<number> {
    const result = await prisma.document.aggregate({
      where: { userId },
      _sum: { tokensUsed: true },
    });
    return result._sum.tokensUsed ?? 0;
  }

  static async sumAiLogTokens(userId: string): Promise<number> {
    const result = await prisma.aiLog.aggregate({
      where: { userId },
      _sum: { tokensUsed: true },
    });
    return result._sum.tokensUsed ?? 0;
  }
}

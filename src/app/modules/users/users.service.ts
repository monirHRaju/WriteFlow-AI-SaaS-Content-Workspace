import { StatusCodes } from 'http-status-codes';
import { Plan } from '@prisma/client';
import AppError from '../../errors/AppError';
import { UsersRepository } from './users.repository';

const PLAN_TOKEN_LIMITS: Record<Plan, number> = {
  FREE: 10_000,
  PRO: 100_000,
  TEAM: 500_000,
};

export type UserStats = {
  totalDocuments: number;
  totalTokens: number;
  plan: Plan;
  planTokenLimit: number;
  planUsagePercent: number;
};

export class UsersService {
  static async getUserStats(userId: string): Promise<UserStats> {
    const user = await UsersRepository.findById(userId);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
    }

    const [totalDocuments, documentTokens, aiTokens] = await Promise.all([
      UsersRepository.countDocuments(userId),
      UsersRepository.sumDocumentTokens(userId),
      UsersRepository.sumAiLogTokens(userId),
    ]);

    const totalTokens = documentTokens + aiTokens;
    const planTokenLimit = PLAN_TOKEN_LIMITS[user.plan];
    const planUsagePercent = Math.min(100, Math.round((totalTokens / planTokenLimit) * 100));

    return {
      totalDocuments,
      totalTokens,
      plan: user.plan,
      planTokenLimit,
      planUsagePercent,
    };
  }

  static async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string }
  ) {
    const user = await UsersRepository.findById(userId);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
    }

    const payload: { name?: string; avatar?: string | null } = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.avatar !== undefined) payload.avatar = data.avatar || null;

    const updated = await UsersRepository.updateById(userId, payload);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
      plan: updated.plan,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}

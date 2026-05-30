import { prisma } from "../../config/prisma";
import { AiLog, Prisma } from "@prisma/client";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

export class AiRepository {
  /**
   * Create a new AI execution log entry.
   * @param data Log creation payload
   */
  static async createLog(
    data: Prisma.AiLogUncheckedCreateInput,
  ): Promise<AiLog> {
    try {
      return await prisma.aiLog.create({ data });
    } catch (error) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to record AI execution log.",
      );
    }
  }

  /**
   * Retrieve all AI logs for a specific user with pagination.
   * @param userId User ID
   * @param page Page number (1-indexed)
   * @param limit Results per page
   */
  static async findAllUserLogs(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ logs: AiLog[]; total: number; totalPage: number }> {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.aiLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.aiLog.count({ where: { userId } }),
      ]);

      const totalPage = Math.ceil(total / limit);

      return { logs, total, totalPage };
    } catch (error) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to retrieve AI execution logs.",
      );
    }
  }

  /**
   * Find a single AI log by ID.
   * @param id Log ID
   */
  static async findLogById(id: string): Promise<AiLog | null> {
    return prisma.aiLog.findUnique({
      where: { id },
    });
  }

  /**
   * Update an existing AI log entry.
   * @param id Log ID
   * @param data Update payload
   */
  static async updateLog(
    id: string,
    data: Prisma.AiLogUpdateInput,
  ): Promise<AiLog> {
    return prisma.aiLog.update({
      where: { id },
      data,
    });
  }
}

import { prisma } from '../../config/prisma';
import { Document, DocumentStatus, Prisma } from '@prisma/client';

export type FindDocumentsOptions = {
  userId: string;
  search?: string;
  status?: DocumentStatus;
  page: number;
  limit: number;
};

export class DocumentsRepository {
  static async create(data: Prisma.DocumentUncheckedCreateInput): Promise<Document> {
    return prisma.document.create({ data });
  }

  static async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({ where: { id } });
  }

  static async findAllByUser(
    options: FindDocumentsOptions
  ): Promise<{ items: Document[]; total: number }> {
    const { userId, search, status, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      userId,
      ...(status && { status }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return { items, total };
  }

  static async updateById(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data,
    });
  }

  static async archiveById(id: string): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  static async countByUser(userId: string): Promise<number> {
    return prisma.document.count({
      where: { userId, status: { not: 'ARCHIVED' } },
    });
  }

  static async sumTokensByUser(userId: string): Promise<number> {
    const result = await prisma.document.aggregate({
      where: { userId },
      _sum: { tokensUsed: true },
    });
    return result._sum.tokensUsed ?? 0;
  }
}

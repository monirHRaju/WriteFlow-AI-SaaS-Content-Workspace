import { prisma } from '../../config/prisma';
import { Document, Prisma } from '@prisma/client';

export class DocumentsRepository {
  static async create(data: Prisma.DocumentUncheckedCreateInput): Promise<Document> {
    return prisma.document.create({ data });
  }

  static async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({ where: { id } });
  }

  static async updateById(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data,
    });
  }
}

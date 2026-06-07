import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { DocumentsRepository } from './documents.repository';
import { Document, DocumentStatus, Prisma } from '@prisma/client';

export class DocumentsService {
  static async createDocument(
    userId: string,
    data: { title: string; content?: string; templateId?: string }
  ): Promise<Document> {
    return DocumentsRepository.create({
      title: data.title,
      content: data.content ?? '',
      userId,
      templateId: data.templateId,
      status: 'DRAFT',
    });
  }

  static async getUserDocuments(
    userId: string,
    options: {
      search?: string;
      status?: DocumentStatus;
      page: number;
      limit: number;
    }
  ): Promise<{ items: Document[]; total: number; page: number; limit: number; totalPages: number }> {
    const { items, total } = await DocumentsRepository.findAllByUser({
      userId,
      ...options,
    });

    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit) || 1,
    };
  }

  static async getDocumentById(id: string, userId: string): Promise<Document> {
    const document = await DocumentsRepository.findById(id);
    if (!document) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Document not found.');
    }
    if (document.userId !== userId) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You do not have access to this document.');
    }
    return document;
  }

  static async updateDocument(
    id: string,
    userId: string,
    payload: Prisma.DocumentUpdateInput
  ): Promise<Document> {
    await this.getDocumentById(id, userId);
    return DocumentsRepository.updateById(id, payload);
  }

  static async archiveDocument(id: string, userId: string): Promise<Document> {
    await this.getDocumentById(id, userId);
    return DocumentsRepository.archiveById(id);
  }
}

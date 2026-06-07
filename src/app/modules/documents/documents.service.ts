import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { DocumentsRepository } from './documents.repository';
import { Document, Prisma } from '@prisma/client';

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
    const document = await DocumentsRepository.findById(id);
    if (!document) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Document not found.');
    }
    if (document.userId !== userId) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You do not have access to this document.');
    }

    return DocumentsRepository.updateById(id, payload);
  }
}

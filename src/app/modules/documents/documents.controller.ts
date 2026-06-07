import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DocumentStatus } from '@prisma/client';
import sendResponse from '../../utils/sendResponse';
import { DocumentsService } from './documents.service';

export class DocumentsController {
  static createDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const document = await DocumentsService.createDocument(userId, req.body);

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Document created successfully!',
        data: document,
      });
    } catch (err) {
      next(err);
    }
  };

  static getUserDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const search = req.query.search as string | undefined;
      const status = req.query.status as DocumentStatus | undefined;
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string || '10', 10)));

      const result = await DocumentsService.getUserDocuments(userId, {
        search,
        status,
        page,
        limit,
      });

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Documents retrieved successfully!',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  static getDocumentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const document = await DocumentsService.getDocumentById(id, userId);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Document retrieved successfully!',
        data: document,
      });
    } catch (err) {
      next(err);
    }
  };

  static updateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const document = await DocumentsService.updateDocument(id, userId, req.body);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Document updated successfully!',
        data: document,
      });
    } catch (err) {
      next(err);
    }
  };

  static archiveDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const document = await DocumentsService.archiveDocument(id, userId);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Document archived successfully!',
        data: document,
      });
    } catch (err) {
      next(err);
    }
  };
};

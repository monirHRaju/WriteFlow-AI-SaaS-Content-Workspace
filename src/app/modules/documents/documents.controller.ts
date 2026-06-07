import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
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
}

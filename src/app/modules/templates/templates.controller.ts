import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../utils/sendResponse';
import { TemplatesService } from './templates.service';

export class TemplatesController {
  /**
   * GET /api/v1/templates
   * Retrieves a paginated list of templates with search, filter, and sorting.
   */
  static getAllTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const sort = req.query.sort as 'popular' | 'newest' | 'rating' | undefined;
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, parseInt(req.query.limit as string || '10', 10));
      
      // Determine if requester has Admin status (optional view clearance)
      const isAdmin = req.user?.role === 'ADMIN';

      const result = await TemplatesService.getAllTemplates({
        search,
        category,
        sort,
        page,
        limit,
        isAdmin,
      });

      const totalPages = Math.ceil(result.total / limit);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Templates retrieved successfully!',
        data: {
          items: result.items,
          total: result.total,
          page,
          limit,
          totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/templates/:slug
   * Retrieves a single template by its unique slug.
   */
  static getTemplateBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const template = await TemplatesService.getTemplateBySlug(slug);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Template retrieved successfully!',
        data: template,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/templates
   * ADMIN only. Creates a new template.
   */
  static createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creatorId = req.user!.id;
      const template = await TemplatesService.createTemplate(req.body, creatorId);

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Template created successfully!',
        data: template,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/templates/:id
   * ADMIN only. Updates an existing template.
   */
  static updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await TemplatesService.updateTemplate(id, req.body);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Template updated successfully!',
        data: template,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/templates/:id
   * ADMIN only. Performs soft delete (sets isPublished to false).
   */
  static softDeleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await TemplatesService.softDeleteTemplate(id);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Template soft-deleted successfully!',
        data: template,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/templates/:id/use
   * Authenticated user only. Increments template usage counter.
   */
  static useTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await TemplatesService.useTemplate(id);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Template usage incremented successfully!',
        data: template,
      });
    } catch (err) {
      next(err);
    }
  };
}

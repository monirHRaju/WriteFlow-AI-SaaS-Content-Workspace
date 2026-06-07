import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

export class AdminController {
  // GET /api/v1/admin/analytics
  static getAnalytics = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await AdminService.getAnalytics();
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin analytics retrieved successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/admin/users
  static getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
      const limit = Math.max(
        1,
        parseInt((req.query.limit as string) || "10", 10),
      );
      const search = (req.query.search as string) || undefined;
      const role = (req.query.role as string) || undefined;

      const { users, total } = await AdminService.getUsers({
        page,
        limit,
        search,
        role,
      });
      const totalPages = Math.ceil(total / limit);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Users retrieved successfully.",
        meta: { page, limit, total, totalPage: totalPages },
        data: users,
      });
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/v1/admin/users/:id/role
  static updateUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const data = await AdminService.updateUserRole(id, role, req.user!.id);
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User role updated successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/v1/admin/users/:id/status
  static updateUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const data = await AdminService.updateUserStatus(
        id,
        isActive,
        req.user!.id,
      );
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: isActive
          ? "User activated successfully."
          : "User banned successfully.",
        data,
      });
    } catch (err) {
      next(err);
    }
  };

  // GET /api/v1/admin/reviews
  static getReviews = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
      const limit = Math.max(
        1,
        parseInt((req.query.limit as string) || "10", 10),
      );

      const { reviews, total } = await AdminService.getPendingReviews({
        page,
        limit,
      });
      const totalPages = Math.ceil(total / limit);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Pending reviews retrieved successfully.",
        meta: { page, limit, total, totalPage: totalPages },
        data: reviews,
      });
    } catch (err) {
      next(err);
    }
  };

  // PATCH /api/v1/admin/reviews/:id
  static updateReview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await AdminService.updateReviewStatus(id, status);
      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Review ${status.toLowerCase()}d successfully.`,
        data,
      });
    } catch (err) {
      next(err);
    }
  };
}

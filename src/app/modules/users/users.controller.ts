import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../utils/sendResponse';
import { UsersService } from './users.service';

export class UsersController {
  static getMyStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const stats = await UsersService.getUserStats(userId);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'User stats retrieved successfully!',
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  };

  static updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await UsersService.updateProfile(userId, req.body);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Profile updated successfully!',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
}

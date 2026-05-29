import { CookieOptions, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: refreshCookieOptions.httpOnly,
    secure: refreshCookieOptions.secure,
    sameSite: refreshCookieOptions.sameSite,
  });
};

export class AuthController {
  // Register operational handler
  static register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await AuthService.register(req.body);
      const { user, accessToken, refreshToken } = result;

      setRefreshTokenCookie(res, refreshToken);

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'User registered successfully!',
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  // Login operational handler
  static login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await AuthService.login(req.body);
      const { user, accessToken, refreshToken } = result;

      setRefreshTokenCookie(res, refreshToken);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'User logged in successfully!',
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  // Refresh Token operational handler
  static refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.cookies;
      const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(refreshToken);

      setRefreshTokenCookie(res, newRefreshToken);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Access token refreshed successfully!',
        data: {
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  // Logout operational handler
  static logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      clearRefreshTokenCookie(res);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Logged out successfully!',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  };

  // Get current session user profile
  static getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getMe(userId);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'User profile retrieved successfully!',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
}

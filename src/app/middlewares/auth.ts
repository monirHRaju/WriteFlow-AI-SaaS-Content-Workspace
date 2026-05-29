import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import config from '../config';
import AppError from '../errors/AppError';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

// Extend Express Request type declarations
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string; email: string; role: Role };
    }
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized to access this resource.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid authorization token format.');
    }

    // Verify access token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (err) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Authorization token has expired or is invalid.');
    }

    const { id } = decoded;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User associated with this token does not exist.');
    }

    if (!user.isActive) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Your account has been deactivated.');
    }

    // Bind sanitized parameters to request context
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'User authentication required.');
      }

      if (!allowedRoles.includes(user.role)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          'You do not have permission to perform this action.'
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

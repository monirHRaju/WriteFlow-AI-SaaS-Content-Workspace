import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../config';
import AppError from '../errors/AppError';
import handleZodError from '../errors/handleZodError';
import { TErrorSource } from '../errors/error.interface';
import logger from '../utils/logger';
import { StatusCodes } from 'http-status-codes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Setup default error options
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let errors: TErrorSource[] = [
    {
      path: '',
      message: 'Something went wrong!',
    },
  ];

  // Specific formats depending on error types
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errors = simplifiedError.errors;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = [
      {
        path: '',
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errors = [
      {
        path: '',
        message: err.message,
      },
    ];
  }

  // Log error using Winston logger
  logger.error(
    `[GlobalError] ${statusCode} - ${message} - Route: ${req.method} ${req.originalUrl} - IP: ${req.ip} - Stack: ${err.stack || 'No Stack'}`
  );

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === 'development' && { stack: err?.stack }),
  });
};

export default globalErrorHandler;

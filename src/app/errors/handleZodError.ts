import { ZodError } from 'zod';
import { TErrorSource, TGenericErrorResponse } from './error.interface';
import { StatusCodes } from 'http-status-codes';

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errors: TErrorSource[] = err.issues.map((issue) => {
    return {
      path: issue.path[issue.path.length - 1] || '',
      message: issue.message,
    };
  });

  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: 'Validation Error',
    errors,
  };
};

export default handleZodError;

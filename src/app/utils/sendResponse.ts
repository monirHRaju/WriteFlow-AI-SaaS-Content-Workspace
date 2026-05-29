import { Response } from 'express';

type TMeta = {
  limit: number;
  page: number;
  total: number;
  totalPage: number;
};

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: TMeta;
  data: T;
};

const sendResponse = <T>(res: Response, responseData: TResponse<T>) => {
  res.status(responseData.statusCode).json({
    success: responseData.success,
    message: responseData.message || 'Success',
    meta: responseData.meta,
    data: responseData.data,
  });
};

export default sendResponse;

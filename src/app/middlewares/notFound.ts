import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notFound: RequestHandler = (req, res, _next) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'API Not Found',
    errors: [
      {
        path: req.originalUrl,
        message: `API endpoint '${req.originalUrl}' does not exist on this server.`,
      },
    ],
  });
};

export default notFound;

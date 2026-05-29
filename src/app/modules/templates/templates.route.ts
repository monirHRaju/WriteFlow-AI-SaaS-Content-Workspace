import express from 'express';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.get('/', (_req, res) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Templates module placeholder route is active.',
    data: {},
  });
});

export const TemplateRoutes = router;

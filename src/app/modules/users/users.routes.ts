import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { requireAuth } from '../../middlewares/auth';
import { UsersController } from './users.controller';
import { UserValidation } from './users.validation';

const router = express.Router();

router.get('/me/stats', requireAuth, UsersController.getMyStats);

router.patch(
  '/me',
  requireAuth,
  validateRequest(UserValidation.updateProfileValidationSchema),
  UsersController.updateProfile
);

export const UserRoutes = router;

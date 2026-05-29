import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { requireAuth } from '../../middlewares/auth';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();

// Register a new user
router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register
);

// Login existing user
router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

// Refresh access session
router.post('/refresh', AuthController.refresh);

// Clear cookies and logout
router.post('/logout', AuthController.logout);

// Retrieve currently authorized profile context
router.get('/me', requireAuth, AuthController.getMe);

export const AuthRoutes = router;

import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { TemplatesController } from './templates.controller';
import { TemplateValidation } from './templates.validation';
import { Role } from '@prisma/client';

const router = express.Router();

/**
 * @route GET /api/v1/templates
 * @desc Get a paginated list of templates with search + filter + sorting
 * @access Public
 */
router.get('/', TemplatesController.getAllTemplates);

/**
 * @route GET /api/v1/templates/:slug
 * @desc Get details of a single template by slug including reviews
 * @access Public
 */
router.get('/:slug', TemplatesController.getTemplateBySlug);

/**
 * @route POST /api/v1/templates
 * @desc Create a new template
 * @access Admin only
 */
router.post(
  '/',
  requireAuth,
  requireRole(Role.ADMIN),
  validateRequest(TemplateValidation.createTemplateValidationSchema),
  TemplatesController.createTemplate
);

/**
 * @route PUT /api/v1/templates/:id
 * @desc Update an existing template
 * @access Admin only
 */
router.put(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN),
  validateRequest(TemplateValidation.updateTemplateValidationSchema),
  TemplatesController.updateTemplate
);

/**
 * @route DELETE /api/v1/templates/:id
 * @desc Soft-delete a template (sets isPublished to false)
 * @access Admin only
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(Role.ADMIN),
  TemplatesController.softDeleteTemplate
);

/**
 * @route POST /api/v1/templates/:id/use
 * @desc Increment the usageCount of a template
 * @access Authenticated
 */
router.post(
  '/:id/use',
  requireAuth,
  TemplatesController.useTemplate
);

export const TemplateRoutes = router;

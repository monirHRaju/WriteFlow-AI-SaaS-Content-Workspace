import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { requireAuth } from '../../middlewares/auth';
import { DocumentsController } from './documents.controller';
import { DocumentValidation } from './documents.validation';

const router = express.Router();

router.post(
  '/',
  requireAuth,
  validateRequest(DocumentValidation.createDocumentValidationSchema),
  DocumentsController.createDocument
);

router.get(
  '/:id',
  requireAuth,
  validateRequest(DocumentValidation.documentIdParamValidationSchema),
  DocumentsController.getDocumentById
);

router.patch(
  '/:id',
  requireAuth,
  validateRequest(DocumentValidation.updateDocumentValidationSchema),
  DocumentsController.updateDocument
);

export const DocumentRoutes = router;

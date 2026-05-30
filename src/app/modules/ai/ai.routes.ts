import express from "express";
import { requireAuth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AiController } from "./ai.controller";
import { AiValidation } from "./ai.validation";

const router = express.Router();

/**
 * POST /api/v1/ai/draft
 * Queue a draft generation job
 * Requires: authentication
 * Body: { templateId, topic, tone, audience, documentId? }
 */
router.post(
  "/draft",
  requireAuth,
  validateRequest(AiValidation.draftAgentValidationSchema),
  AiController.draft,
);

/**
 * POST /api/v1/ai/rewrite
 * Queue a rewrite generation job
 * Requires: authentication
 * Body: { text, mode }
 */
router.post(
  "/rewrite",
  requireAuth,
  validateRequest(AiValidation.rewriteAgentValidationSchema),
  AiController.rewrite,
);

/**
 * GET /api/v1/ai/status/:jobId
 * Poll for job progress and retrieve results
 * Requires: authentication
 */
router.get("/status/:jobId", requireAuth, AiController.status);

/**
 * GET /api/v1/ai/logs
 * Retrieve user's AI execution history with pagination
 * Query: ?page=1&limit=10
 * Requires: authentication
 */
router.get("/logs", requireAuth, AiController.logs);

export const AiRoutes = router;

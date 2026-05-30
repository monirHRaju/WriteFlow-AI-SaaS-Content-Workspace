import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utils/sendResponse";

import { AiRepository } from "./ai.repository";
import { aiQueue } from "../../config/queue";
import { TJobPayload } from "./ai.types";
import AppError from "../../errors/AppError";
import logger from "../../utils/logger";

export class AiController {
  /**
   * Draft endpoint: Queue a draft generation job.
   * Returns immediately with jobId for polling.
   */
  static draft = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User ID is required.");
      }

      const payload: TJobPayload = {
        userId,
        type: "DRAFT",
        payload: req.body,
      };

      // Queue the job
      const job = await aiQueue.add("draft", payload, {
        removeOnComplete: true,
        removeOnFail: false,
      });

      logger.info(
        `📝 Draft job queued for user ${userId} with jobId: ${job.id}`,
      );

      sendResponse(res, {
        statusCode: StatusCodes.ACCEPTED,
        success: true,
        message: "Draft generation job queued successfully.",
        data: {
          jobId: job.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Rewrite endpoint: Queue a rewrite generation job.
   * Returns immediately with jobId for polling.
   */
  static rewrite = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User ID is required.");
      }

      const payload: TJobPayload = {
        userId,
        type: "REWRITE",
        payload: req.body,
      };

      // Queue the job
      const job = await aiQueue.add("rewrite", payload, {
        removeOnComplete: true,
        removeOnFail: false,
      });

      logger.info(
        `✏️ Rewrite job queued for user ${userId} with jobId: ${job.id}`,
      );

      sendResponse(res, {
        statusCode: StatusCodes.ACCEPTED,
        success: true,
        message: "Rewrite generation job queued successfully.",
        data: {
          jobId: job.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Status endpoint: Poll for job progress/results.
   * Returns job state, progress, or final result.
   */
  static status = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "jobId parameter is required.",
        );
      }

      const job = await aiQueue.getJob(jobId);
      if (!job) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          "Job not found or has expired.",
        );
      }

      const jobState = await job.getState();
      const jobProgress = job.progress;
      const jobData = job.data as TJobPayload;
      let result = null;

      // If job is completed, return the result
      if (jobState === "completed") {
        result = job.returnvalue;
      }

      // If job failed, include error details
      if (jobState === "failed") {
        const failedReason = job.failedReason || "Unknown error";
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Job failed: ${failedReason}`,
        );
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Job status: ${jobState}`,
        data: {
          jobId,
          status: jobState,
          progress: jobProgress,
          type: jobData.type,
          result,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Logs endpoint: Retrieve user's AI execution history.
   */
  static logs = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User ID is required.");
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;

      if (page < 1 || limit < 1) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "page and limit must be positive integers.",
        );
      }

      const { logs, total, totalPage } = await AiRepository.findAllUserLogs(
        userId,
        page,
        limit,
      );

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "AI execution logs retrieved successfully.",
        meta: {
          page,
          limit,
          total,
          totalPage,
        },
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  };
}

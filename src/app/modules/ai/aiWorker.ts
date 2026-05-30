import { Worker, Job } from "bullmq";
import config from "../../config";
import logger from "../../utils/logger";
import { AiService } from "./ai.service";
import { TJobPayload, TDraftInput, TRewriteInput } from "./ai.types";

/**
 * BullMQ Worker for AI Generation Jobs
 * Processes draft and rewrite jobs with concurrency: 3
 */
export const aiWorker = new Worker("ai-generation", aiJobHandler, {
  connection: {
    host: new URL(config.redisUrl).hostname,
    port: parseInt(new URL(config.redisUrl).port || "6379"),
  },
  concurrency: 3,
});

/**
 * Main job processing handler
 */
async function aiJobHandler(job: Job<TJobPayload>): Promise<any> {
  try {
    logger.info(`🔄 Processing job ${job.id} of type ${job.data.type}`);

    const { userId, type, payload } = job.data;

    if (type === "DRAFT") {
      const result = await AiService.processDraftJob(
        userId,
        payload as TDraftInput,
      );
      logger.info(`✅ Draft job ${job.id} completed successfully`);
      return result;
    }

    if (type === "REWRITE") {
      const result = await AiService.processRewriteJob(
        userId,
        payload as TRewriteInput,
      );
      logger.info(`✅ Rewrite job ${job.id} completed successfully`);
      return result;
    }

    throw new Error(`Unknown job type: ${type}`);
  } catch (error) {
    logger.error(`❌ Job ${job.id} failed: ${error}`);
    throw error;
  }
}

/**
 * Event listeners for worker lifecycle
 */
aiWorker.on("completed", (job) => {
  logger.info(`✨ Job ${job.id} completed`);
});

aiWorker.on("failed", (job, err) => {
  logger.error(`💥 Job ${job?.id} failed with error: ${err.message}`);
});

aiWorker.on("error", (err) => {
  logger.error(`⚠️ Worker error: ${err.message}`);
});

aiWorker.on("active", (job) => {
  logger.info(`🚀 Job ${job.id} is now active (concurrency: 3)`);
});

/**
 * Graceful shutdown handler
 */
process.on("SIGTERM", async () => {
  logger.warn("📛 SIGTERM received. Closing AI Worker gracefully...");
  await aiWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.warn("📛 SIGINT received. Closing AI Worker gracefully...");
  await aiWorker.close();
  process.exit(0);
});

export default aiWorker;

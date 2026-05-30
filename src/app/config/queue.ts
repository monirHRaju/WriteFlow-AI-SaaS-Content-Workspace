import { Queue } from "bullmq";
import config from "./index";

/**
 * BullMQ Queue named 'ai-generation' configured with Redis connection URL.
 */
export const aiQueue = new Queue("ai-generation", {
  connection: {
    host: new URL(config.redisUrl).hostname,
    port: parseInt(new URL(config.redisUrl).port || "6379"),
  },
});

export default aiQueue;

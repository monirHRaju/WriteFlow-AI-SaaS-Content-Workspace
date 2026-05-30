import { Server } from "http";
import app from "./app";
import config from "./app/config";
import logger from "./app/utils/logger";
// Initialize AI Worker by importing it (side effect)
import "./app/modules/ai/aiWorker";

let server: Server;

function bootstrap() {
  try {
    // Initialize AI Worker for background job processing
    logger.info("🤖 Initializing AI Generation Worker with concurrency: 3");

    server = app.listen(config.port, () => {
      logger.info(
        `🚀 WriteFlow AI backend operational on port ${config.port} in [${config.env}] mode.`,
      );
      logger.info("✅ AI Worker is ready to process generation jobs.");
    });
  } catch (err) {
    logger.error(`❌ Server bootstrap error: ${err}`);
    process.exit(1);
  }
}

bootstrap();

// Watch for unhandled promise rejections globally
process.on("unhandledRejection", (err) => {
  logger.error(`⚠️ Unhandled Promise Rejection intercepted: ${err}`);
  if (server) {
    server.close(() => {
      logger.warn(
        "HTTP server terminated gracefully due to unhandled rejection.",
      );
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Watch for uncaught exceptions globally
process.on("uncaughtException", (err) => {
  logger.error(`⚠️ Uncaught Exception intercepted: ${err}`);
  logger.warn("Process terminating immediately due to uncaught exception.");
  process.exit(1);
});

require("dotenv").config();
const { startConnection } = require("./src/core/connection");
const { startHealthServer } = require("./src/core/healthcheck");
const { logger } = require("./src/utils/logger");

logger.info("Starting WhatsApp Chatbot (Ayres Parallel)...");
logger.info({
  model: process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud",
  host: process.env.OLLAMA_HOST || "https://ollama.com",
});

// Start HTTP health check server FIRST (Railway requires PORT binding)
startHealthServer();

startConnection().catch((err) => {
  logger.error({ err: err.message }, "Fatal error during startup");
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down...");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  logger.error({ err: err.message, stack: err.stack }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
  process.exit(1);
});

const express = require("express");
const { logger } = require("../utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

let botStatus = {
  status: "starting",
  connectedAt: null,
  reconnectAttempts: 0,
  uptime: () => process.uptime(),
};

function setStatus(status, data = {}) {
  botStatus = { ...botStatus, status, ...data };
}

// Health check endpoint — Railway hits this to verify service is alive
app.get("/", (req, res) => {
  res.json({
    service: "WhatsApp Chatbot - Ayres Parallel",
    status: botStatus.status,
    connectedAt: botStatus.connectedAt,
    uptimeSeconds: Math.floor(process.uptime()),
    reconnectAttempts: botStatus.reconnectAttempts,
  });
});

app.get("/health", (req, res) => {
  const ok = botStatus.status === "connected";
  res.status(ok ? 200 : 503).json({ ok, status: botStatus.status });
});

function startHealthServer() {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Health check server running");
  });
}

module.exports = { startHealthServer, setStatus };

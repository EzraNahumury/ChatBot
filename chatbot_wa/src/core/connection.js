const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");
const pino = require("pino");
const { routeMessage } = require("./router");
const { logger } = require("../utils/logger");
const { setStatus, setQR } = require("./healthcheck");

const SESSION_DIR = path.join(
  process.env.SESSION_DIR || __dirname + "/../../auth"
);

let reconnectAttempts = 0;
const MAX_RECONNECT = 10;
const RECONNECT_DELAY = 5000; // 5 seconds
let currentSock = null;

async function logoutBot() {
  logger.info("Logout requested via web panel");
  if (currentSock) {
    try {
      await currentSock.logout();
    } catch (_) { /* ignore */ }
  }
  if (fs.existsSync(SESSION_DIR)) {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    logger.info("Session cleared by logout");
  }
  setStatus("logged_out");
  setQR(null);
  reconnectAttempts = 0;
  setTimeout(() => startConnection(), 2000);
}

async function startConnection() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  logger.info({ version: version.join(".") }, "Using Baileys version");

  currentSock = null;
  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }), // silence Baileys internal logs
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    printQRInTerminal: false, // we handle it manually
    browser: ["AyresParallel-Bot", "Chrome", "124.0.0"],
    markOnlineOnConnect: false, // avoid detection
    syncFullHistory: false,
  });

  // QR code event
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      setStatus("waiting_qr");
      setQR(qr);
      logger.info("QR Code generated — scan with WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      currentSock = sock;
      reconnectAttempts = 0;
      setStatus("connected", { connectedAt: new Date().toISOString(), reconnectAttempts: 0 });
      setQR(null);
      logger.info("✅ WhatsApp connected successfully!");
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      logger.warn({ reason }, "Connection closed");
      setStatus("disconnected", { reconnectAttempts });

      // Check disconnect reason
      if (reason === DisconnectReason.loggedOut) {
        logger.warn("Session logged out — clearing session and generating new QR...");
        setStatus("logged_out");
        // Delete all session files so next startConnection() generates fresh QR
        if (fs.existsSync(SESSION_DIR)) {
          fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          logger.info("Session cleared. Restarting in 3 seconds...");
        }
        reconnectAttempts = 0;
        setTimeout(() => startConnection(), 3000);
        return;
      } else if (
        reason === DisconnectReason.connectionReplaced ||
        reason === DisconnectReason.multideviceMismatch
      ) {
        logger.error("Connection replaced by another session. Exiting.");
        setStatus("replaced");
        process.exit(1);
      } else {
        // Attempt reconnect
        if (reconnectAttempts < MAX_RECONNECT) {
          reconnectAttempts++;
          setStatus("reconnecting", { reconnectAttempts });
          logger.info(
            { attempt: reconnectAttempts, maxAttempts: MAX_RECONNECT },
            `Reconnecting in ${RECONNECT_DELAY / 1000}s...`
          );
          setTimeout(() => startConnection(), RECONNECT_DELAY);
        } else {
          logger.error("Max reconnect attempts reached. Exiting.");
          process.exit(1);
        }
      }
    }
  });

  // Save credentials when updated
  sock.ev.on("creds.update", saveCreds);

  // Handle incoming messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      // Skip messages sent by the bot itself
      if (msg.key.fromMe) continue;
      await routeMessage(sock, msg);
    }
  });

  return sock;
}

module.exports = { startConnection, logoutBot };

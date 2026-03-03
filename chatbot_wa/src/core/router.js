const { handleCommand } = require("../handlers/commandHandler");
const { handleAI } = require("../handlers/aiHandler");
const { isRateLimited, randomDelay } = require("../utils/throttle");
const { logger, maskPhone } = require("../utils/logger");

// Route incoming message to appropriate handler
async function routeMessage(sock, msg) {
  try {
    const jid = msg.key.remoteJid;

    // Skip group messages (only handle private chats)
    if (jid.endsWith("@g.us")) {
      logger.debug({ jid }, "Skipping group message");
      return;
    }

    // Skip broadcast and status
    if (jid === "status@broadcast" || jid.includes("broadcast")) return;

    // Extract text from message
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      "";

    if (!text || text.trim() === "") {
      logger.debug({ jid: maskPhone(jid) }, "Empty message, skipping");
      return;
    }

    const phone = jid.replace("@s.whatsapp.net", "");
    logger.info({ phone: maskPhone(phone), text: text.slice(0, 80) }, "Incoming message");

    // Rate limit check
    if (isRateLimited(phone)) {
      logger.warn({ phone: maskPhone(phone) }, "Rate limited");
      await sendMessage(sock, jid, "Kak, kamu terlalu banyak kirim pesan. Tunggu sebentar ya 😊");
      return;
    }

    // Simulate typing delay (human-like)
    await randomDelay();

    // Check command rules first
    const commandResult = handleCommand(phone, text);
    if (commandResult.handled) {
      logger.info({ phone: maskPhone(phone) }, `Command handled: "${text.slice(0, 30)}"`);
      await sendMessage(sock, jid, commandResult.reply);
      return;
    }

    // Fall through to AI
    const aiReply = await handleAI(phone, text);
    await sendMessage(sock, jid, aiReply);
  } catch (err) {
    logger.error({ err: err.message }, "routeMessage error");
  }
}

async function sendMessage(sock, jid, text) {
  try {
    await sock.sendMessage(jid, { text });
  } catch (err) {
    logger.error({ jid, err: err.message }, "Failed to send message");
  }
}

module.exports = { routeMessage };

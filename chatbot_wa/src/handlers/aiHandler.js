const { askAI } = require("../ai/ollama");
const { logger, maskPhone } = require("../utils/logger");

const FALLBACK_TIMEOUT =
  "Maaf kak, sistem saya lagi sibuk. Coba tanyakan lagi dalam beberapa saat ya 🙏";
const FALLBACK_ERROR =
  "Maaf kak, ada gangguan teknis. Coba lagi sebentar ya, atau ketik admin untuk dibantu langsung.";

async function handleAI(phone, text) {
  try {
    logger.info({ phone: maskPhone(phone) }, "Sending to AI...");
    const reply = await askAI(phone, text);
    logger.info({ phone: maskPhone(phone) }, "AI replied successfully");
    return reply;
  } catch (err) {
    if (err.message === "TIMEOUT") {
      return FALLBACK_TIMEOUT;
    }
    logger.error({ phone: maskPhone(phone), err: err.message }, "AI handler error");
    return FALLBACK_ERROR;
  }
}

module.exports = { handleAI };

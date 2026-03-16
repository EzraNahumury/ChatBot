const { askAI } = require("../ai/ollama");
const { logger, maskPhone } = require("../utils/logger");

const FALLBACK_TIMEOUT =
  "Maaf kak, sistem saya lagi sibuk. Coba tanyakan lagi dalam beberapa saat ya 🙏";
const FALLBACK_ERROR =
  "Maaf kak, ada gangguan teknis. Coba lagi sebentar ya, atau ketik admin untuk dibantu langsung.";
const ADMIN_IMAGE_FOLLOWUP_REPLY =
  "Baik kak, nanti akan ada admin yang memberikan updatean selanjutnya.";
const EXPRESS_LOAD_NOTE =
  "Note: penerimaan express menyesuaikan load produksi, jadi tidak semua request express bisa kami terima ya kak.";

function normalizeReply(reply, userText = "") {
  if (!reply) return reply;

  let normalized = reply;
  const lowerUserText = (userText || "").toLowerCase();
  const asksForImage = [
    "gambar",
    "foto",
    "katalog",
    "contoh desain",
    "contoh",
    "size chart",
  ].some((k) => lowerUserText.includes(k));
  const promisesSendingImage =
    /(kirim|kirimkan|share).*(gambar|foto|contoh|hasil desain)/i.test(normalized) ||
    /(gambar|foto|contoh|hasil desain).*(kirim|kirimkan|share)/i.test(normalized);
  const asksExpress =
    /(express|ekspres|urgent|produksi cepat|proses cepat|sehari jadi|1 hari|3 hari|5 hari|7 hari)/i.test(
      lowerUserText,
    );
  const hasExpressCapacityNote =
    /(load produksi|kapasitas produksi|menyesuaikan.*produksi|tidak semua.*express|cek.*produksi)/i.test(
      normalized,
    );

  // Guardrail: never promise sending image in fallback context.
  if (asksForImage && promisesSendingImage) {
    return ADMIN_IMAGE_FOLLOWUP_REPLY;
  }

  // Guardrail for a known awkward phrase.
  normalized = normalized.replace(
    /mau saya kirim gambarnya sekarang ya\s*\?*/gi,
    ADMIN_IMAGE_FOLLOWUP_REPLY,
  );

  if (asksExpress && !hasExpressCapacityNote) {
    normalized = `${normalized}\n\n${EXPRESS_LOAD_NOTE}`;
  }

  return normalized;
}

async function handleAI(phone, text) {
  try {
    logger.info({ phone: maskPhone(phone) }, "Sending to AI...");
    const reply = normalizeReply(await askAI(phone, text), text);
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

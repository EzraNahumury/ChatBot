const axios = require("axios");
const { buildSystemPrompt } = require("./prompt");
const { logger } = require("../utils/logger");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "https://ollama.com";
const OLLAMA_KEY = process.env.OLLAMA_KEY || "";
const MODEL_NAME = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT || "25000"); // 25 seconds

// In-memory conversation history: phone -> messages[]
const historyMap = new Map();
const MAX_HISTORY = parseInt(process.env.MAX_HISTORY || "10");

function getHistory(phone) {
  return historyMap.get(phone) || [];
}

function addToHistory(phone, role, content) {
  const history = getHistory(phone);
  history.push({ role, content });
  // Keep only last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  historyMap.set(phone, history);
}

function clearHistory(phone) {
  historyMap.delete(phone);
}

async function askAI(phone, userMessage) {
  // Build message array with system prompt + history + new user message
  const systemPrompt = buildSystemPrompt();
  const history = getHistory(phone);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/chat`,
      {
        model: MODEL_NAME,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(OLLAMA_KEY ? { Authorization: `Bearer ${OLLAMA_KEY}` } : {}),
        },
        timeout: AI_TIMEOUT,
      }
    );

    const assistantReply =
      response.data?.message?.content ||
      response.data?.choices?.[0]?.message?.content || // OpenAI-compatible fallback
      "";

    if (!assistantReply) {
      throw new Error("Empty response from AI");
    }

    // Save to history
    addToHistory(phone, "user", userMessage);
    addToHistory(phone, "assistant", assistantReply);

    return assistantReply.trim();
  } catch (err) {
    if (axios.isAxiosError(err) && err.code === "ECONNABORTED") {
      logger.warn({ phone }, "AI request timed out");
      throw new Error("TIMEOUT");
    }
    logger.error({ err: err.message }, "AI request failed");
    throw err;
  }
}

module.exports = { askAI, clearHistory };

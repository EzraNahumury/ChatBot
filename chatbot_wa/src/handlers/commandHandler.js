const { clearHistory } = require("../ai/ollama");

// Rule-based commands checked BEFORE sending to AI
// Returns { handled: true, reply: string } or { handled: false }

function handleCommand(phone, text) {
  const lower = text.trim().toLowerCase();

  if (lower === "ping") {
    return { handled: true, reply: "pong 🏓" };
  }

  if (lower === "menu" || lower === "halo" || lower === "hi" || lower === "hello") {
    return {
      handled: true,
      reply:
        "Halo kak! Selamat datang di Ayres Parallel 👋\n\n" +
        "Saya CS virtual yang siap bantu kamu.\n" +
        "Silakan ceritakan kebutuhan jersey kamu, misalnya:\n" +
        "- Cabang olahraga\n" +
        "- Jumlah (qty)\n" +
        "- Deadline\n\n" +
        "Ketik pertanyaanmu dan saya akan bantu ya!",
    };
  }

  if (lower === "reset" || lower === "/reset") {
    clearHistory(phone);
    return { handled: true, reply: "Okey, percakapan kita mulai dari awal ya 🙂" };
  }

  if (lower === "admin") {
    return {
      handled: true,
      reply:
        "Baik kak, saya hubungkan ke admin dulu ya. Mohon tunggu sebentar 🙏",
    };
  }

  // Blacklist check (spam/inappropriate)
  const blacklist = ["judi", "togel", "porn", "bokep", "scam"];
  if (blacklist.some((word) => lower.includes(word))) {
    return {
      handled: true,
      reply: "Maaf, saya tidak bisa membantu untuk hal tersebut.",
    };
  }

  return { handled: false };
}

module.exports = { handleCommand };

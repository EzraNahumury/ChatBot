const { clearHistory } = require("../ai/ollama");
const path = require("path");
const fs = require("fs");

const GAMBAR_DIR = path.join(__dirname, "../../gambar");

// Rule-based commands checked BEFORE sending to AI
// Returns { handled: true, reply: string }
//       | { handled: true, type: 'image', images: [{path, caption}] }
//       | { handled: false }

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

  // Katalog jersey
  const katalogKeywords = ["katalog", "catalog", "list jersey", "daftar jersey", "pilihan jersey", "model jersey"];
  if (katalogKeywords.some((k) => lower.includes(k))) {
    const katalogPath = path.join(GAMBAR_DIR, "katalog", "katalog_jersey.jpeg");
    if (fs.existsSync(katalogPath)) {
      return {
        handled: true,
        type: "image",
        images: [{ path: katalogPath, caption: "Ini katalog jersey kami kak! 🏀\n\nAda banyak pilihan model & tim. Kalau ada yang cocok, langsung kabarin aja ya 😊" }],
      };
    }
  }

  // Contoh desain / hasil design
  const designKeywords = ["contoh design", "contoh desain", "hasil design", "hasil desain", "referensi design", "referensi desain", "contoh jersey", "lihat desain", "lihat design"];
  if (designKeywords.some((k) => lower.includes(k))) {
    const designDir = path.join(GAMBAR_DIR, "hasil_design");
    if (fs.existsSync(designDir)) {
      const files = fs.readdirSync(designDir).filter((f) =>
        /\.(jpg|jpeg|png|webp)$/i.test(f)
      );
      if (files.length > 0) {
        const images = files.map((f, i) => ({
          path: path.join(designDir, f),
          caption: i === 0
            ? `Ini beberapa contoh hasil desain jersey kami kak! ✨\n\nSemua bisa dikustomisasi sesuai kebutuhan tim kamu 🔥`
            : "",
        }));
        return { handled: true, type: "image", images };
      }
    }
    return {
      handled: true,
      reply: "Maaf kak, belum ada foto contoh desain yang tersedia saat ini. Hubungi admin untuk info lebih lanjut ya 🙏",
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

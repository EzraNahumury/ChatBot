const { clearHistory } = require("../ai/ollama");
const path = require("path");
const fs = require("fs");

const GAMBAR_DIR = path.join(__dirname, "../../gambar");

// Rule-based commands checked BEFORE sending to AI
// Returns { handled: true, reply: string }
//       | { handled: true, type: 'image', images: [{path, caption}] }
//       | { handled: false }

// State: track users who are awaiting katalog category selection
const katalogState = new Map(); // phone -> 'awaiting_katalog'

const KATALOG_CATEGORIES = [
  {
    id: 1,
    name: "Classic Adi Vira",
    folder: "katalog classic Adi Vira",
    keywords: ["adi vira", "adivira", "1"],
  },
  {
    id: 2,
    name: "Classic Cakra Vega",
    folder: "katalog classic Cakra Vega",
    keywords: ["cakra vega", "cakravega", "2"],
  },
  {
    id: 3,
    name: "Pro Bima Sena",
    folder: "katalog pro Bima Sena",
    keywords: ["bima sena", "bimasena", "3"],
  },
  {
    id: 4,
    name: "Pro Garuda Vastra",
    folder: "katalog pro Garuda Vastra",
    keywords: ["garuda vastra", "garudavastra", "4"],
  },
];

function getKatalogImages(folder, categoryName) {
  const folderPath = path.join(GAMBAR_DIR, "katalog", folder);
  if (!fs.existsSync(folderPath)) return [];
  const files = fs.readdirSync(folderPath)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();
  return files.map((f, i) => ({
    path: path.join(folderPath, f),
    caption: i === 0
      ? `Ini katalog *${categoryName}* kak! 🔥\n\nKalau ada yang cocok, langsung kabarin kami ya 😊`
      : "",
  }));
}

function clearKatalogState(phone) {
  katalogState.delete(phone);
}

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
    clearKatalogState(phone);
    return { handled: true, reply: "Okey, percakapan kita mulai dari awal ya 🙂" };
  }

  if (lower === "admin") {
    return {
      handled: true,
      reply:
        "Baik kak, saya hubungkan ke admin dulu ya. Mohon tunggu sebentar 🙏",
    };
  }

  // --- Katalog: step 2 — user sedang memilih kategori ---
  if (katalogState.get(phone) === "awaiting_katalog") {
    const matched = KATALOG_CATEGORIES.find((cat) =>
      cat.keywords.some((kw) => lower.includes(kw))
    );
    if (matched) {
      katalogState.delete(phone);
      const images = getKatalogImages(matched.folder, matched.name);
      if (images.length > 0) {
        return { handled: true, type: "image", images };
      }
      return {
        handled: true,
        reply: `Maaf kak, gambar katalog *${matched.name}* belum tersedia. Hubungi admin ya 🙏`,
      };
    }
    // User input tidak cocok, tanya ulang
    return {
      handled: true,
      reply:
        "Maaf kak, pilihannya tidak dikenali 😅\n\n" +
        "Silakan ketik angka atau nama kategori:\n" +
        "1️⃣ Classic Adi Vira\n" +
        "2️⃣ Classic Cakra Vega\n" +
        "3️⃣ Pro Bima Sena\n" +
        "4️⃣ Pro Garuda Vastra",
    };
  }

  // --- Katalog: step 1 — user minta katalog ---
  const katalogKeywords = ["katalog", "catalog", "list jersey", "daftar jersey", "pilihan jersey", "model jersey"];
  if (katalogKeywords.some((k) => lower.includes(k))) {
    katalogState.set(phone, "awaiting_katalog");
    return {
      handled: true,
      reply:
        "Hai kak! Kami punya 4 pilihan katalog jersey 🏀\n\n" +
        "1️⃣ Classic Adi Vira\n" +
        "2️⃣ Classic Cakra Vega\n" +
        "3️⃣ Pro Bima Sena\n" +
        "4️⃣ Pro Garuda Vastra\n\n" +
        "Ketik angka atau nama katalog yang ingin kamu lihat ya kak 😊",
    };
  }

  // Size chart
  const sizeKeywords = ["size chart", "sizechart", "ukuran baju", "ukuran jersey", "tabel ukuran", "size baju", "size jersey", "ukuran size", "chart size"];
  if (sizeKeywords.some((k) => lower.includes(k))) {
    const sizeDir = path.join(GAMBAR_DIR, "Size Chart");
    if (fs.existsSync(sizeDir)) {
      const files = fs.readdirSync(sizeDir)
        .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .sort();
      if (files.length > 0) {
        const images = files.map((f, i) => ({
          path: path.join(sizeDir, f),
          caption: i === 0
            ? "Ini size chart jersey kami kak! 📏\n\nKalau masih bingung pilih ukuran, jangan ragu tanya ya 😊"
            : "",
        }));
        return { handled: true, type: "image", images };
      }
    }
    return {
      handled: true,
      reply: "Maaf kak, size chart belum tersedia saat ini. Hubungi admin untuk info ukuran ya 🙏",
    };
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

module.exports = { handleCommand, clearKatalogState };

import { readdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { DATASET_MD_CONTENT } from "../../lib/knowledge-base";
import {
  type AssistantResponse,
  type ChatMessage,
  EMPTY_LEAD,
  type LeadData,
  type MediaGroup,
  type MediaKind,
} from "../../lib/types";

type ChatRequestBody = {
  message?: string;
  history?: ChatMessage[];
  lead?: LeadData;
};

const FALLBACK_RESPONSE: AssistantResponse = {
  reply:
    "Maaf, sistem sedang mengalami kendala. Mohon kirim ulang pesan Anda, nanti saya bantu lanjutkan data pesanannya.",
  extracted: EMPTY_LEAD,
  all_data_complete: false,
};

const IMAGE_ROOT_DIR = path.join(process.cwd(), "gambar");
const MEDIA_FOLDER_MAP: Record<MediaKind, string> = {
  design: "hasil_design",
  catalog: "katalog",
};
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function renderField(value: string | number | null): string {
  return value === null ? "null" : String(value);
}

function buildConversationHistory(history: ChatMessage[]): string {
  if (!history.length) {
    return "Belum ada riwayat.";
  }

  return history
    .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`)
    .join("\n");
}

function buildSystemPrompt({
  message,
  history,
  lead,
}: {
  message: string;
  history: ChatMessage[];
  lead: LeadData;
}): string {
  return `
Kamu adalah Lana, AI sales assistant resmi untuk Ayres Parallel, perusahaan custom jersey di Indonesia.

Ikuti semua aturan dengan ketat.

========================
ATURAN UTAMA
========================

1. Gunakan HANYA informasi dari Knowledge Base yang diberikan.
2. DILARANG mengarang harga, kebijakan, bahan, atau estimasi produksi.
3. Jika informasi tidak tersedia di Knowledge Base, katakan bahwa akan dikonfirmasi ke admin.
4. Bantu customer secara bertahap untuk melengkapi data pesanan.
5. Gunakan bahasa Indonesia yang natural, ramah, dan profesional.
6. Jangan pernah mengeluarkan teks selain JSON valid.
7. Jangan gunakan markdown.
8. Jika output bukan JSON valid, sistem akan gagal.

Panduan gaya bahasa:
- Tulis seperti admin chat yang santai-profesional, tidak terlalu formal.
- Pakai kalimat ringkas dan hangat, boleh pakai kata seperti "boleh", "siap", "ya".
- Hindari kalimat baku yang kaku dan hindari paragraf panjang.
- Tetap sopan, jelas, dan fokus ke langkah berikutnya.

========================
DATA PESANAN WAJIB
========================

Data yang harus dikumpulkan:

- sport
- qty
- deadline
- city
- design_status (have | need_help)
- name_number (yes | no)

Jika ada data yang belum lengkap, tanyakan field yang paling prioritas berikutnya.

Urutan prioritas pertanyaan:
1. sport
2. qty
3. deadline
4. city
5. design_status
6. name_number

Jika user bertanya harga tetapi qty belum ada tanyakan qty terlebih dahulu.
Jangan memberikan harga pasti kecuali tertulis jelas di Knowledge Base.

========================
KNOWLEDGE BASE
========================

${DATASET_MD_CONTENT}

========================
DATA LEAD SAAT INI
========================

Sport: ${renderField(lead.sport)}
Qty: ${renderField(lead.qty)}
Deadline: ${renderField(lead.deadline)}
City: ${renderField(lead.city)}
Design Status: ${renderField(lead.design_status)}
Name & Number: ${renderField(lead.name_number)}

Jika bernilai null berarti belum diisi.

========================
RIWAYAT PERCAKAPAN
========================

${buildConversationHistory(history)}

========================
PESAN USER TERBARU
========================

${message}

========================
TUGAS ANDA
========================

1. Ekstrak informasi pesanan dari pesan user jika ada.
2. Isi hanya field yang baru ditemukan.
3. Tentukan apakah masih ada data yang belum lengkap.
4. Jika belum lengkap tanyakan pertanyaan berikutnya sesuai prioritas.
5. Jika semua data lengkap:
   - Berikan ringkasan pesanan dengan jelas
   - Berikan langkah selanjutnya (misalnya admin akan follow up atau kirim desain)
6. Jika user bertanya FAQ:
   - Jawab hanya berdasarkan Knowledge Base.
7. Jika maksud user tidak jelas:
   - Minta klarifikasi secara singkat.

========================
FORMAT OUTPUT WAJIB
========================

Kembalikan HANYA JSON valid dengan struktur berikut:

{
  "reply": "Balasan natural dalam Bahasa Indonesia",
  "extracted": {
    "sport": string|null,
    "qty": number|null,
    "deadline": string|null,
    "city": string|null,
    "design_status": "have"|"need_help"|null,
    "name_number": "yes"|"no"|null
  },
  "all_data_complete": true|false
}

ATURAN TAMBAHAN:
- Jika tidak menemukan nilai baru untuk suatu field, isi null.
- Jangan ulangi data lama kecuali memang baru diekstrak dari pesan ini.
- Jangan beri penjelasan tambahan di luar JSON.
- Pastikan JSON valid dan bisa di-parse.
  `.trim();
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length ? value.trim() : null;
}

function asNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return value;
}

function normalizeResponse(value: unknown): AssistantResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as Record<string, unknown>;
  const extracted = (input.extracted ?? {}) as Record<string, unknown>;

  const normalized: AssistantResponse = {
    reply:
      typeof input.reply === "string" && input.reply.trim().length
        ? input.reply.trim()
        : "Baik, saya bantu lanjut. Bisa info detail berikutnya?",
    extracted: {
      sport: asStringOrNull(extracted.sport),
      qty: asNumberOrNull(extracted.qty),
      deadline: asStringOrNull(extracted.deadline),
      city: asStringOrNull(extracted.city),
      design_status:
        extracted.design_status === "have" || extracted.design_status === "need_help"
          ? extracted.design_status
          : null,
      name_number:
        extracted.name_number === "yes" || extracted.name_number === "no"
          ? extracted.name_number
          : null,
    },
    all_data_complete: Boolean(input.all_data_complete),
  };

  return normalized;
}

function tryParseModelJson(rawContent: string): AssistantResponse | null {
  try {
    const direct = normalizeResponse(JSON.parse(rawContent));
    if (direct) {
      return direct;
    }
  } catch {
    // Ignore direct parse error and try extracting object content below.
  }

  const objectMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    return null;
  }

  try {
    return normalizeResponse(JSON.parse(objectMatch[0]));
  } catch {
    return null;
  }
}

function detectMediaRequestKinds(message: string): MediaKind[] {
  const text = message.toLowerCase();
  const asksDesign =
    /(contoh|sample|referensi|inspirasi|hasil).{0,24}(desain|design|jersey)/i.test(text) ||
    /(desain|design).{0,24}(dong|donk|aja|ya|nih|nya)/i.test(text);
  const asksCatalog = /(katalog|catalog|list model|pilihan model|lihat model)/i.test(text);

  const kinds: MediaKind[] = [];
  if (asksDesign) {
    kinds.push("design");
  }
  if (asksCatalog) {
    kinds.push("catalog");
  }

  return kinds;
}

async function loadMediaGroup(kind: MediaKind): Promise<MediaGroup | null> {
  const folder = MEDIA_FOLDER_MAP[kind];
  const absoluteFolder = path.join(IMAGE_ROOT_DIR, folder);
  const dirEntries = await readdir(absoluteFolder, { withFileTypes: true });
  const files = dirEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "id"));

  if (!files.length) {
    return null;
  }

  return {
    kind,
    title: kind === "design" ? "Contoh desain yang tersedia" : "Katalog yang tersedia",
    images: files.map((fileName) => `/api/files/${folder}/${encodeURIComponent(fileName)}`),
  };
}

function createMediaNote(kinds: MediaKind[]): string {
  if (kinds.length === 2) {
    return "Saya lampirkan contoh desain dan katalog di bawah ya.";
  }
  return kinds[0] === "catalog"
    ? "Saya lampirkan katalog yang tersedia di bawah ya."
    : "Saya lampirkan contoh desain yang tersedia di bawah ya.";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        {
          ...FALLBACK_RESPONSE,
          reply: "Pesan belum terisi. Silakan tulis pertanyaan atau detail pesanan Anda.",
        },
        { status: 400 },
      );
    }

    const history = Array.isArray(body.history)
      ? body.history.filter(
          (item): item is ChatMessage =>
            Boolean(item) &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string",
        )
      : [];

    const lead: LeadData = {
      sport: asStringOrNull(body.lead?.sport),
      qty: asNumberOrNull(body.lead?.qty),
      deadline: asStringOrNull(body.lead?.deadline),
      city: asStringOrNull(body.lead?.city),
      design_status:
        body.lead?.design_status === "have" || body.lead?.design_status === "need_help"
          ? body.lead.design_status
          : null,
      name_number:
        body.lead?.name_number === "yes" || body.lead?.name_number === "no"
          ? body.lead.name_number
          : null,
    };

    const prompt = buildSystemPrompt({ message, history, lead });
    const host = (
      process.env.OLLAMA_HOST ??
      process.env.OLLAMA_BASE_URL ??
      "https://ollama.com"
    )
      .trim()
      .replace(/\/+$/, "");
    const apiKey = (process.env.OLLAMA_KEY ?? process.env.OLLAMA_API_KEY ?? "").trim();
    const model = (process.env.OLLAMA_MODEL ?? "gpt-oss:120b-cloud").trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    const ollamaRes = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
        },
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!ollamaRes.ok) {
      const detail = (await ollamaRes.text()).slice(0, 180);
      return NextResponse.json(
        {
          ...FALLBACK_RESPONSE,
          reply: `Koneksi ke Ollama gagal (${ollamaRes.status}). Mohon cek OLLAMA_HOST, OLLAMA_KEY, dan OLLAMA_MODEL.`,
        },
        {
          status: 502,
          headers: detail
            ? {
                "X-Ollama-Error": detail.replace(/[^\x20-\x7E]/g, " "),
              }
            : undefined,
        },
      );
    }

    const raw = (await ollamaRes.json()) as { message?: { content?: string } };
    const content = raw.message?.content?.trim();
    if (!content) {
      return NextResponse.json(FALLBACK_RESPONSE, { status: 502 });
    }

    let parsed: AssistantResponse | null = null;
    try {
      parsed = tryParseModelJson(content);
    } catch {
      parsed = null;
    }

    if (!parsed) {
      return NextResponse.json(FALLBACK_RESPONSE, { status: 502 });
    }

    const mediaKinds = detectMediaRequestKinds(message);
    if (mediaKinds.length) {
      const mediaGroups = (await Promise.all(mediaKinds.map(loadMediaGroup))).filter(
        (item): item is MediaGroup => item !== null,
      );
      if (mediaGroups.length) {
        parsed.media = mediaGroups;
        parsed.reply = `${parsed.reply}\n\n${createMediaNote(mediaKinds)}`;
      }
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch {
    return NextResponse.json(FALLBACK_RESPONSE, { status: 500 });
  }
}

import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const BASE_DIR = path.join(process.cwd(), "gambar");
const ALLOWED_DIRS = new Set(["hasil_design", "katalog"]);
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string[] }> },
) {
  try {
    const params = await context.params;
    const raw = Array.isArray(params.slug) ? params.slug : [];
    if (raw.length < 2) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const [folder, ...nameParts] = raw.map(safeDecode);
    if (!ALLOWED_DIRS.has(folder) || nameParts.some((part) => part.includes(".."))) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const fileName = nameParts.join("/");
    const absolutePath = path.resolve(BASE_DIR, folder, fileName);
    const folderRoot = path.resolve(BASE_DIR, folder);
    if (!absolutePath.startsWith(folderRoot)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext];
    if (!contentType) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const binary = await readFile(absolutePath);
    return new Response(binary, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { getKnowledgeFile, saveKnowledgeContent } from "../../../lib/knowledge-store";

type SaveKnowledgeBody = {
  content?: string;
};

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const file = await getKnowledgeFile();
  return NextResponse.json({
    ok: true,
    content: file.content,
    updated_at: file.updated_at,
  });
}

export async function POST(req: Request) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as SaveKnowledgeBody;
    const content = body.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json(
        { ok: false, message: "Knowledge tidak boleh kosong." },
        { status: 400 },
      );
    }

    const saved = await saveKnowledgeContent(content);
    return NextResponse.json({
      ok: true,
      content: saved.content,
      updated_at: saved.updated_at,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan knowledge." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { clearAdminSessionCookie } from "../../../lib/admin-auth";

export async function POST() {
  try {
    await clearAdminSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal logout admin." },
      { status: 500 },
    );
  }
}

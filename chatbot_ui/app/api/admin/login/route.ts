import { NextResponse } from "next/server";

import { isValidAdminPassword, setAdminSessionCookie } from "../../../lib/admin-auth";

type LoginBody = {
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const password = body.password?.trim() ?? "";

    if (!isValidAdminPassword(password)) {
      return NextResponse.json(
        { ok: false, message: "Password admin salah." },
        { status: 401 },
      );
    }

    await setAdminSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal login admin." },
      { status: 500 },
    );
  }
}

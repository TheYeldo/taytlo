import { NextResponse } from "next/server";
import { logoutCurrentSession } from "@/lib/account-store";
import { clearSessionCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await logoutCurrentSession();
    clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    clearSessionCookie();
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Не удалось удалить серверную сессию"
      },
      { status: 200 }
    );
  }
}

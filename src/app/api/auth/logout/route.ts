import { NextResponse } from "next/server";
import { logoutCurrentSession } from "@/lib/account-store";
import { clearSessionCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export async function POST() {
  await logoutCurrentSession();
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { AccountStoreUnavailableError, loginUser } from "@/lib/account-store";
import { setSessionCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginUser({
      email: String(body.email || ""),
      password: String(body.password || "")
    });
    setSessionCookie(result.token);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    const status = error instanceof AccountStoreUnavailableError ? 503 : 401;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось войти" },
      { status }
    );
  }
}

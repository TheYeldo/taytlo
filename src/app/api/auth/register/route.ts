import { NextResponse } from "next/server";
import { AccountStoreUnavailableError, registerUser } from "@/lib/account-store";
import { setSessionCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser({
      email: String(body.email || ""),
      name: String(body.name || ""),
      password: String(body.password || "")
    });
    setSessionCookie(result.token);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    const status = error instanceof AccountStoreUnavailableError ? 503 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось зарегистрироваться" },
      { status }
    );
  }
}

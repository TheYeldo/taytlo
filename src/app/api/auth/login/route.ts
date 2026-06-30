import { NextResponse } from "next/server";
import { loginUser } from "@/lib/account-store";
import { setSessionCookie } from "@/lib/session-cookie";

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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось войти" }, { status: 401 });
  }
}

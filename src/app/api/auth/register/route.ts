import { NextResponse } from "next/server";
import { registerUser } from "@/lib/account-store";
import { setSessionCookie } from "@/lib/session-cookie";

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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось зарегистрироваться" }, { status: 400 });
  }
}

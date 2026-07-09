import { NextResponse } from "next/server";
import { getCurrentLibrary, saveCurrentLibrary } from "@/lib/account-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getCurrentLibrary();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const result = await saveCurrentLibrary(body.library || body);
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(result);
}

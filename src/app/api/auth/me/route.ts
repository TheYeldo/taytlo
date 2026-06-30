import { NextResponse } from "next/server";
import { activeStoreName, getCurrentLibrary } from "@/lib/account-store";

export async function GET() {
  const result = await getCurrentLibrary();
  if (!result) return NextResponse.json({ user: null, library: null }, { status: 401 });
  return NextResponse.json({ ...result, store: activeStoreName() });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin";
import { getBackendHealth } from "@/lib/backend-health";

export async function GET(request: NextRequest) {
  if (!requireAdminRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await getBackendHealth());
}

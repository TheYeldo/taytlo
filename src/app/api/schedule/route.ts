import { NextResponse } from "next/server";
import { getUpcomingSchedule } from "@/lib/schedule";

export const revalidate = 900;

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const limit = Math.min(50, Math.max(1, Number(params.get("limit") || 12)));
  return NextResponse.json({
    items: getUpcomingSchedule(limit),
    updatedAt: new Date().toISOString()
  });
}

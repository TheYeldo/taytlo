import { NextResponse } from "next/server";
import { getLiveUpcomingSchedule } from "@/lib/schedule";

export const revalidate = 900;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const limit = Math.min(50, Math.max(1, Number(params.get("limit") || 12)));
  const schedule = await getLiveUpcomingSchedule(limit);

  return NextResponse.json({
    items: schedule.items,
    source: schedule.source,
    updatedAt: new Date().toISOString(),
    error: schedule.error
  });
}

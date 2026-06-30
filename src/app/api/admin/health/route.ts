import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin";
import { activeStoreName } from "@/lib/account-store";
import { getCatalogStats } from "@/lib/catalog";
import { getUpcomingSchedule } from "@/lib/schedule";

export function GET(request: NextRequest) {
  if (!requireAdminRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = getCatalogStats();
  const upcoming = getUpcomingSchedule(50);

  return NextResponse.json({
    ok: true,
    store: activeStoreName(),
    stats,
    upcomingEpisodes: upcoming.length,
    env: {
      adminToken: Boolean(process.env.ADMIN_TOKEN),
      databaseUrl: Boolean(process.env.DATABASE_URL),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null
    },
    generatedAt: new Date().toISOString()
  });
}

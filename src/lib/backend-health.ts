import "server-only";
import { activeStoreName } from "./account-store";
import { getCatalogStats } from "./catalog";
import { getPrisma } from "./prisma";
import { getUpcomingSchedule } from "./schedule";

type BackendDatabaseHealth = {
  configured: boolean;
  enabled: boolean;
  ok: boolean;
  latencyMs: number | null;
  error: string | null;
  counts: {
    users: number;
    sessions: number;
    libraries: number;
    anime: number;
    favorites: number;
    comments: number;
    progress: number;
    watchlist: number;
  } | null;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 280);
  return "Unknown database error";
}

export async function getBackendHealth() {
  const store = activeStoreName();
  const stats = getCatalogStats();
  const upcoming = getUpcomingSchedule(50);
  const database: BackendDatabaseHealth = {
    configured: Boolean(process.env.DATABASE_URL),
    enabled: store === "prisma",
    ok: false,
    latencyMs: null,
    error: null,
    counts: null
  };

  if (database.configured) {
    const startedAt = Date.now();
    try {
      const prisma = getPrisma();
      await prisma.$queryRaw`SELECT 1`;
      const [users, sessions, libraries, anime, favorites, comments, progress, watchlist] = await Promise.all([
        prisma.user.count(),
        prisma.session.count(),
        prisma.userLibrary.count(),
        prisma.anime.count(),
        prisma.favorite.count(),
        prisma.comment.count({ where: { isHidden: false } }),
        prisma.watchProgress.count(),
        prisma.watchListItem.count()
      ]);

      database.ok = true;
      database.latencyMs = Date.now() - startedAt;
      database.counts = {
        users,
        sessions,
        libraries,
        anime,
        favorites,
        comments,
        progress,
        watchlist
      };
    } catch (error) {
      database.ok = false;
      database.latencyMs = Date.now() - startedAt;
      database.error = errorMessage(error);
    }
  }

  return {
    ok: store !== "prisma" || database.ok,
    store,
    stats,
    upcomingEpisodes: upcoming.length,
    database,
    env: {
      adminToken: Boolean(process.env.ADMIN_TOKEN),
      databaseUrl: Boolean(process.env.DATABASE_URL),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      yandexMetrika: Boolean(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID)
    },
    generatedAt: new Date().toISOString()
  };
}

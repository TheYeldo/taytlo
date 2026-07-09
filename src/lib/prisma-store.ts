import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { WatchStatus } from "@prisma/client";
import { getPrisma } from "./prisma";
import { ensureAnimeRowByCatalogId } from "./prisma-anime";
import { getSessionToken } from "./session-cookie";
import {
  cleanRecord,
  emptyLibrary,
  normalizeEmail,
  nowIso,
  sessionMaxAgeSeconds,
  uniqueStrings
} from "./account-types";
import type { ProgressEntry, PublicUser, UserLibrary } from "./account-types";

type PrismaUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString("hex")
  };
}

function verifyPassword(password: string, salt: string, hash: string) {
  const candidate = Buffer.from(hashPassword(password, salt).hash, "hex");
  const stored = Buffer.from(hash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

function publicUser(user: PrismaUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0] || "Taytlo user",
    createdAt: user.createdAt.toISOString()
  };
}

function jsonArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function jsonObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeLibrary(row: {
  favorites: unknown;
  watchStatuses: unknown;
  progress: unknown;
  history: unknown;
  comments: unknown;
  updatedAt: Date;
}): UserLibrary {
  return {
    favorites: uniqueStrings(row.favorites),
    watchStatuses: jsonObject(row.watchStatuses) as Record<string, string>,
    progress: jsonObject(row.progress) as Record<string, ProgressEntry>,
    history: jsonArray(row.history).slice(0, 80) as UserLibrary["history"],
    comments: jsonObject(row.comments) as Record<string, string[]>,
    updatedAt: row.updatedAt.toISOString()
  };
}

function normalizeWatchStatus(value: string): WatchStatus | null {
  const normalized = value.toLocaleLowerCase("ru");
  if (normalized === "watching") return "WATCHING";
  if (normalized === "completed") return "COMPLETED";
  if (normalized === "dropped") return "DROPPED";
  if (normalized === "planned") return "PLANNED";
  return null;
}

async function syncFavorites(userId: string, favorites: string[]) {
  const prisma = getPrisma();
  await prisma.favorite.deleteMany({ where: { userId } });

  for (const catalogId of favorites) {
    const anime = await ensureAnimeRowByCatalogId(catalogId);
    if (!anime) continue;
    await prisma.favorite.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId: anime.id
        }
      },
      update: {},
      create: {
        userId,
        animeId: anime.id
      }
    });
  }
}

async function syncWatchStatuses(userId: string, watchStatuses: Record<string, string>) {
  const prisma = getPrisma();
  await prisma.watchListItem.deleteMany({ where: { userId } });

  for (const [catalogId, rawStatus] of Object.entries(watchStatuses)) {
    const status = normalizeWatchStatus(rawStatus);
    if (!status) continue;
    const anime = await ensureAnimeRowByCatalogId(catalogId);
    if (!anime) continue;
    await prisma.watchListItem.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId: anime.id
        }
      },
      update: { status },
      create: {
        userId,
        animeId: anime.id,
        status
      }
    });
  }
}

async function syncProgress(userId: string, progress: Record<string, ProgressEntry>) {
  const prisma = getPrisma();

  for (const [catalogId, entry] of Object.entries(progress)) {
    const anime = await ensureAnimeRowByCatalogId(catalogId);
    if (!anime) continue;
    await prisma.watchProgress.upsert({
      where: {
        userId_animeId_episodeNumber: {
          userId,
          animeId: anime.id,
          episodeNumber: entry.episodeNumber
        }
      },
      update: {
        positionSec: Math.max(0, Math.floor(entry.seconds || 0)),
        provider: "taytlo"
      },
      create: {
        userId,
        animeId: anime.id,
        episodeNumber: entry.episodeNumber,
        positionSec: Math.max(0, Math.floor(entry.seconds || 0)),
        provider: "taytlo"
      }
    });
  }
}

async function syncNormalizedLibrary(userId: string, next: UserLibrary, input: Partial<UserLibrary>) {
  if (input.favorites !== undefined) await syncFavorites(userId, next.favorites);
  if (input.watchStatuses !== undefined) await syncWatchStatuses(userId, next.watchStatuses);
  if (input.progress !== undefined) await syncProgress(userId, next.progress);
}

async function cleanExpiredSessions() {
  const prisma = getPrisma();
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date()
      }
    }
  });
}

async function createSession(userId: string) {
  const prisma = getPrisma();
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + sessionMaxAgeSeconds * 1000)
    }
  });
  return token;
}

export async function registerUser(input: { email: string; name: string; password: string }) {
  const prisma = getPrisma();
  const email = normalizeEmail(input.email);
  const name = input.name.trim() || email.split("@")[0] || "Taytlo user";
  if (!email.includes("@")) throw new Error("Укажите корректную почту");
  if (input.password.length < 6) throw new Error("Пароль должен быть от 6 символов");

  await cleanExpiredSessions();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Пользователь уже существует");

  const password = hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordSalt: password.salt,
      passwordHash: password.hash,
      library: {
        create: {
          favorites: [],
          watchStatuses: {},
          progress: {},
          history: [],
          comments: {}
        }
      }
    }
  });

  const token = await createSession(user.id);
  return { user: publicUser(user), token };
}

export async function loginUser(input: { email: string; password: string }) {
  const prisma = getPrisma();
  const email = normalizeEmail(input.email);
  await cleanExpiredSessions();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordSalt || !user.passwordHash || !verifyPassword(input.password, user.passwordSalt, user.passwordHash)) {
    throw new Error("Неверная почта или пароль");
  }
  const token = await createSession(user.id);
  return { user: publicUser(user), token };
}

export async function getCurrentUser() {
  const prisma = getPrisma();
  const token = getSessionToken();
  if (!token) return null;
  await cleanExpiredSessions();
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session) return null;
  return publicUser(session.user);
}

export async function logoutCurrentSession() {
  const prisma = getPrisma();
  const token = getSessionToken();
  if (!token) return;
  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true }
  });
  if (!session) return;
  await prisma.session.deleteMany({ where: { userId: session.userId } });
}

export async function getCurrentLibrary() {
  const prisma = getPrisma();
  const user = await getCurrentUser();
  if (!user) return null;

  const library = await prisma.userLibrary.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      favorites: [],
      watchStatuses: {},
      progress: {},
      history: [],
      comments: {}
    },
    update: {}
  });

  return { user, library: normalizeLibrary(library) };
}

export async function saveCurrentLibrary(input: Partial<UserLibrary>) {
  const prisma = getPrisma();
  const user = await getCurrentUser();
  if (!user) return null;

  const previousResult = await getCurrentLibrary();
  const previous = previousResult?.library || emptyLibrary();
  const next: UserLibrary = {
    favorites: uniqueStrings(input.favorites ?? previous.favorites),
    watchStatuses: cleanRecord(input.watchStatuses ?? previous.watchStatuses) as Record<string, string>,
    progress: cleanRecord(input.progress ?? previous.progress) as Record<string, ProgressEntry>,
    history: Array.isArray(input.history) ? input.history.slice(0, 80) : previous.history,
    comments: cleanRecord(input.comments ?? previous.comments) as Record<string, string[]>,
    updatedAt: nowIso()
  };

  const library = await prisma.userLibrary.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      favorites: next.favorites,
      watchStatuses: next.watchStatuses,
      progress: next.progress,
      history: next.history,
      comments: next.comments
    },
    update: {
      favorites: next.favorites,
      watchStatuses: next.watchStatuses,
      progress: next.progress,
      history: next.history,
      comments: next.comments
    }
  });

  await syncNormalizedLibrary(user.id, next, input);

  return { user, library: normalizeLibrary(library) };
}

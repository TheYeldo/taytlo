import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { activeStoreName, getCurrentUser } from "./account-store";
import { getAnimeBySlug } from "./catalog";
import { getPrisma } from "./prisma";
import { ensureAnimeRowBySlug } from "./prisma-anime";

export type PublicEpisodeComment = {
  id: string;
  animeSlug: string;
  episodeNumber: number | null;
  authorName: string;
  body: string;
  createdAt: string;
};

type DevCommentsDb = {
  comments: PublicEpisodeComment[];
};

const devCommentsPath = path.join(process.cwd(), "data", "dev-comments.json");
const maxBodyLength = 700;

function cleanEpisodeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

function cleanBody(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxBodyLength);
}

function usePrismaStore() {
  return activeStoreName() === "prisma";
}

async function readDevComments(): Promise<DevCommentsDb> {
  try {
    const raw = await fs.readFile(devCommentsPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<DevCommentsDb>;
    return {
      comments: Array.isArray(parsed.comments) ? parsed.comments : []
    };
  } catch {
    return { comments: [] };
  }
}

async function writeDevComments(db: DevCommentsDb) {
  await fs.mkdir(path.dirname(devCommentsPath), { recursive: true });
  await fs.writeFile(devCommentsPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

export async function getEpisodeComments(input: { slug: string; episodeNumber?: unknown }) {
  const episodeNumber = cleanEpisodeNumber(input.episodeNumber);

  if (usePrismaStore()) {
    const anime = getAnimeBySlug(input.slug);
    if (!anime) return [];

    const prisma = getPrisma();
    const animeRow = await prisma.anime.findUnique({ where: { slug: anime.slug } });
    if (!animeRow) return [];

    const comments = await prisma.comment.findMany({
      where: {
        animeId: animeRow.id,
        episodeNumber,
        isHidden: false
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "asc" },
      take: 100
    });

    return comments.map<PublicEpisodeComment>((comment) => ({
      id: comment.id,
      animeSlug: anime.slug,
      episodeNumber: comment.episodeNumber,
      authorName: comment.user.name || comment.user.email.split("@")[0] || "Taytlo user",
      body: comment.body,
      createdAt: comment.createdAt.toISOString()
    }));
  }

  const db = await readDevComments();
  return db.comments
    .filter((comment) => comment.animeSlug === input.slug && comment.episodeNumber === episodeNumber)
    .slice(-100);
}

export async function addEpisodeComment(input: { slug: string; episodeNumber?: unknown; body: unknown }) {
  const user = await getCurrentUser();
  if (!user) return { status: "unauthorized" as const };

  const body = cleanBody(input.body);
  if (!body) return { status: "invalid" as const, message: "Комментарий пустой" };

  const anime = getAnimeBySlug(input.slug);
  if (!anime) return { status: "not-found" as const };

  const episodeNumber = cleanEpisodeNumber(input.episodeNumber);

  if (usePrismaStore()) {
    const animeRow = await ensureAnimeRowBySlug(anime.slug);
    if (!animeRow) return { status: "not-found" as const };

    const prisma = getPrisma();
    const comment = await prisma.comment.create({
      data: {
        animeId: animeRow.id,
        userId: user.id,
        episodeNumber,
        body
      }
    });

    return {
      status: "created" as const,
      comment: {
        id: comment.id,
        animeSlug: anime.slug,
        episodeNumber: comment.episodeNumber,
        authorName: user.name,
        body: comment.body,
        createdAt: comment.createdAt.toISOString()
      } satisfies PublicEpisodeComment
    };
  }

  const db = await readDevComments();
  const comment: PublicEpisodeComment = {
    id: randomBytes(12).toString("hex"),
    animeSlug: anime.slug,
    episodeNumber,
    authorName: user.name,
    body,
    createdAt: new Date().toISOString()
  };

  db.comments.push(comment);
  db.comments = db.comments.slice(-1000);
  await writeDevComments(db);

  return { status: "created" as const, comment };
}

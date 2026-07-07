import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const catalogPath = path.join(process.cwd(), "data", "catalog.json");

function externalIdsFor(anime) {
  const ids = [];

  if (anime.malId) {
    ids.push({
      provider: "MYANIMELIST",
      externalId: String(anime.malId),
      url: `https://myanimelist.net/anime/${anime.malId}`
    });
  }

  if (anime.aniLibriaReleaseId) {
    ids.push({
      provider: "ANILIBRIA",
      externalId: String(anime.aniLibriaReleaseId),
      url: `https://anilibria.top/release/id${anime.aniLibriaReleaseId}.html`
    });
  }

  if (anime.shikimori?.id) {
    ids.push({
      provider: "SHIKIMORI",
      externalId: String(anime.shikimori.id),
      url: anime.shikimori.url || `https://shikimori.one/animes/${anime.shikimori.id}`
    });
  }

  return ids;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to sync catalog into Prisma");
  }

  const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  if (!Array.isArray(catalog)) {
    throw new Error("data/catalog.json must contain an array");
  }

  let animeCount = 0;
  let externalIdCount = 0;

  for (const anime of catalog) {
    const row = await prisma.anime.upsert({
      where: { slug: anime.slug },
      update: {
        title: anime.title,
        titleRu: anime.titleRu,
        type: anime.type,
        year: anime.year,
        episodes: anime.episodes,
        synopsis: anime.synopsis,
        posterUrl: anime.image,
        franchise: anime.franchise,
        genres: anime.genres || [],
        status: anime.status || "unknown",
        shikimoriScore: anime.shikimori?.score || null,
        shikimoriVotes: anime.shikimori?.votes || null,
        popularityBase: Number(anime.popularityBase || 0) + Number(anime.requestBase || 0)
      },
      create: {
        slug: anime.slug,
        title: anime.title,
        titleRu: anime.titleRu,
        type: anime.type,
        year: anime.year,
        episodes: anime.episodes,
        synopsis: anime.synopsis,
        posterUrl: anime.image,
        franchise: anime.franchise,
        genres: anime.genres || [],
        status: anime.status || "unknown",
        shikimoriScore: anime.shikimori?.score || null,
        shikimoriVotes: anime.shikimori?.votes || null,
        popularityBase: Number(anime.popularityBase || 0) + Number(anime.requestBase || 0)
      }
    });

    animeCount += 1;

    for (const externalId of externalIdsFor(anime)) {
      await prisma.animeExternalId.upsert({
        where: {
          provider_externalId: {
            provider: externalId.provider,
            externalId: externalId.externalId
          }
        },
        update: {
          animeId: row.id,
          url: externalId.url
        },
        create: {
          animeId: row.id,
          provider: externalId.provider,
          externalId: externalId.externalId,
          url: externalId.url
        }
      });
      externalIdCount += 1;
    }
  }

  console.log(`Synced ${animeCount} anime and ${externalIdCount} external ids into Prisma.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

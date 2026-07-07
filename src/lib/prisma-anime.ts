import "server-only";
import { getAnimeBySlug, getCatalog } from "./catalog";
import { getPrisma } from "./prisma";

type CatalogAnime = ReturnType<typeof getCatalog>[number];

function animeData(anime: CatalogAnime) {
  return {
    title: anime.title,
    titleRu: anime.titleRu,
    type: anime.type,
    year: anime.year,
    episodes: anime.episodes,
    synopsis: anime.synopsis,
    posterUrl: anime.image,
    franchise: anime.franchise,
    genres: anime.genres,
    status: anime.status,
    shikimoriScore: anime.shikimori?.score,
    shikimoriVotes: anime.shikimori?.votes,
    popularityBase: anime.popularityBase + anime.requestBase
  };
}

export async function ensureAnimeRowBySlug(slug: string) {
  const anime = getAnimeBySlug(slug);
  if (!anime) return null;

  const prisma = getPrisma();
  return prisma.anime.upsert({
    where: { slug: anime.slug },
    update: animeData(anime),
    create: {
      slug: anime.slug,
      ...animeData(anime)
    }
  });
}

export async function ensureAnimeRowByCatalogId(catalogId: string) {
  const anime = getCatalog().find((item) => item.id === catalogId);
  if (!anime) return null;

  const prisma = getPrisma();
  return prisma.anime.upsert({
    where: { slug: anime.slug },
    update: animeData(anime),
    create: {
      slug: anime.slug,
      ...animeData(anime)
    }
  });
}

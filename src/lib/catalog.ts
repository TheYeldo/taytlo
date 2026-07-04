import catalogData from "../../data/catalog.json";
import type { Anime, CatalogQuery, CatalogResult } from "./types";

const catalog = catalogData as Anime[];

function normalize(value: string | number | null | undefined) {
  return String(value ?? "")
    .toLocaleLowerCase("ru")
    .normalize("NFKC")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function byScore(anime: Anime) {
  return anime.shikimori?.score ?? -1;
}

function byPopularity(anime: Anime) {
  return anime.popularityBase + anime.requestBase;
}

function sortCatalog(items: Anime[], sort: CatalogQuery["sort"] = "popular") {
  const sorted = [...items];
  if (sort === "rating") {
    return sorted.sort((left, right) => byScore(right) - byScore(left));
  }
  if (sort === "new") {
    return sorted.sort((left, right) => (right.year ?? 0) - (left.year ?? 0));
  }
  if (sort === "title") {
    return sorted.sort((left, right) => left.titleRu.localeCompare(right.titleRu, "ru"));
  }
  return sorted.sort((left, right) => byPopularity(right) - byPopularity(left));
}

export function getCatalog() {
  return catalog;
}

export function getAnimeBySlug(slug: string) {
  const normalized = normalize(slug);
  return catalog.find((anime) => anime.slug === slug || anime.id === slug || normalize(anime.titleRu) === normalized) ?? null;
}

export function getGenres() {
  return [...new Set(catalog.flatMap((anime) => anime.genres))].sort((left, right) => left.localeCompare(right, "ru"));
}

export function getFranchises() {
  return [...new Set(catalog.map((anime) => anime.franchise).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "ru")
  );
}

export function getCatalogStats() {
  const withRating = catalog.filter((anime) => anime.shikimori?.score).length;
  const withEpisodes = catalog.filter((anime) => anime.aniLibriaReleaseId).length;
  return {
    total: catalog.length,
    withRating,
    withoutRating: catalog.length - withRating,
    withEpisodes,
    withoutEpisodes: catalog.length - withEpisodes,
    genres: getGenres().length,
    franchises: getFranchises().length
  };
}

export function queryCatalog(query: CatalogQuery = {}): CatalogResult {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(60, Math.max(6, Number(query.limit || 24)));
  const search = normalize(query.search);
  const genre = normalize(query.genre);
  const franchise = normalize(query.franchise);
  const onlyWithEpisodes = query.availability === "episodes";

  const filtered = catalog.filter((anime) => {
    if (onlyWithEpisodes && !anime.aniLibriaReleaseId) return false;
    if (genre && !anime.genres.some((item) => normalize(item) === genre)) return false;
    if (franchise && normalize(anime.franchise) !== franchise) return false;
    if (!search) return true;

    const haystack = normalize([
      anime.titleRu,
      anime.title,
      anime.franchise,
      anime.year,
      anime.type,
      ...anime.genres,
      ...anime.altTitles
    ].join(" "));
    return haystack.includes(search);
  });

  const sorted = sortCatalog(filtered, query.sort);
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);

  return {
    items,
    total: sorted.length,
    page,
    limit,
    hasMore: start + limit < sorted.length
  };
}

export function getRelatedAnime(anime: Anime, count = 8) {
  const currentGenres = new Set(anime.genres.map(normalize));
  return sortCatalog(
    catalog.filter((item) => {
      if (item.id === anime.id) return false;
      if (normalize(item.franchise) === normalize(anime.franchise)) return true;
      return item.genres.some((genre) => currentGenres.has(normalize(genre)));
    }),
    "rating"
  ).slice(0, count);
}

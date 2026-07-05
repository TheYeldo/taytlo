import type { Anime } from "./types";

export const siteName = "Taytlo";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function cleanAnimeText(value: string | null | undefined) {
  return String(value || "")
    .replace(/\[\/?[a-z]+(?:=[^\]]+)?\]/gi, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasBrokenEncoding(value: string) {
  if (!value) return false;
  if (value.includes("�")) return true;

  const suspicious = value.match(/[ÐÑ][\u0080-\u00bf]|[РС][\u0400-\u045f\u201a-\u203a\u00a0-\u00bf]/gu) || [];
  return suspicious.length >= 4 && suspicious.length > value.length / 40;
}

export function animeSynopsis(anime: Anime) {
  const synopsis = cleanAnimeText(anime.synopsis);
  if (synopsis && !hasBrokenEncoding(synopsis)) return synopsis;

  return `${anime.titleRu}: описание пока уточняется. Здесь уже доступны жанры, рейтинг Shikimori, связанные тайтлы и серии, если они есть в AniLibria.`;
}

export function animeDescription(anime: Anime) {
  const base = animeSynopsis(anime);
  return base.length > 158 ? `${base.slice(0, 155).trim()}...` : base;
}

export function animeJsonLd(anime: Anime) {
  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: anime.titleRu,
    alternateName: [anime.title, ...anime.altTitles].filter(Boolean),
    image: anime.image.startsWith("http") ? anime.image : `${siteUrl()}${anime.image}`,
    datePublished: anime.year ? `${anime.year}-01-01` : undefined,
    genre: anime.genres,
    aggregateRating: anime.shikimori?.score
      ? {
          "@type": "AggregateRating",
          ratingValue: anime.shikimori.score,
          ratingCount: anime.shikimori.votes,
          bestRating: 10,
          worstRating: 1
        }
      : undefined,
    url: `${siteUrl()}/anime/${anime.slug}`
  };
}

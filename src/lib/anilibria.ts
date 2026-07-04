import { getAnimeBySlug } from "./catalog";
import type { AniLibriaEpisode, AniLibriaEpisodesResult, Anime } from "./types";

type AniLibriaRelease = {
  id: number;
  type?: {
    value?: string;
    description?: string;
  };
  year?: number;
  alias?: string;
  external_player?: string;
  episodes_total?: number;
  is_ongoing?: boolean;
  name?: {
    main?: string;
    english?: string;
    alternative?: string;
  };
  episodes?: Array<{
    id?: number | string;
    ordinal?: number;
    name?: string;
    name_english?: string;
    hls_1080?: string;
    hls_720?: string;
    hls_480?: string;
    duration?: number;
  }>;
};

const anilibriaBase = "https://anilibria.top";

function normalizeTitle(value: string | null | undefined) {
  return String(value || "")
    .toLocaleLowerCase("ru")
    .normalize("NFKC")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeType(value: string | null | undefined) {
  const normalized = String(value || "").toUpperCase().replace(/[^A-Z]+/g, "_");
  if (normalized.includes("MOVIE")) return "MOVIE";
  if (normalized.includes("OVA")) return "OVA";
  if (normalized.includes("ONA")) return "ONA";
  if (normalized.includes("SPECIAL")) return "SPECIAL";
  if (normalized.includes("TV")) return "TV";
  return normalized;
}

function absoluteAniLibriaUrl(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${anilibriaBase}${raw}`;
  return `${anilibriaBase}/${raw}`;
}

function releaseUrl(release: AniLibriaRelease) {
  if (release.external_player) return absoluteAniLibriaUrl(release.external_player);
  if (release.alias) return `${anilibriaBase}/release/${release.alias}.html`;
  return `${anilibriaBase}/api/v1/anime/releases/${release.id}`;
}

function matchScore(anime: Anime, release: AniLibriaRelease) {
  const animeNames = [anime.titleRu, anime.title, ...anime.altTitles].map(normalizeTitle).filter(Boolean);
  const releaseNames = [release.name?.main, release.name?.english, release.name?.alternative].map(normalizeTitle).filter(Boolean);
  let score = 0;
  let hasStrongTitle = false;
  let hasCloseYear = false;
  let hasCloseEpisodes = false;
  let hasTypeMatch = false;

  for (const animeName of animeNames) {
    for (const releaseName of releaseNames) {
      if (animeName === releaseName) {
        score = Math.max(score, 14);
        hasStrongTitle = true;
      }
      else if (Math.min(animeName.length, releaseName.length) >= 5 && (animeName.includes(releaseName) || releaseName.includes(animeName))) {
        score = Math.max(score, 6);
      }
    }
  }

  const yearDiff = Math.abs(Number(anime.year || 0) - Number(release.year || 0));
  if (anime.year && release.year && yearDiff === 0) {
    score += 5;
    hasCloseYear = true;
  } else if (anime.year && release.year && yearDiff === 1) {
    score += 3;
    hasCloseYear = true;
  } else if (anime.year && release.year && yearDiff <= 2) {
    score += 1;
    hasCloseYear = true;
  } else if (anime.year && release.year && yearDiff >= 3) {
    score -= yearDiff >= 8 ? 10 : 8;
  }

  const animeType = normalizeType(anime.type);
  const releaseType = normalizeType(release.type?.value);
  if (animeType && releaseType) {
    if (animeType === releaseType) {
      score += 3;
      hasTypeMatch = true;
    } else if ((animeType === "TV" && releaseType === "MOVIE") || (animeType === "MOVIE" && releaseType === "TV")) {
      score -= 5;
    }
  }

  const animeEpisodes = Number(anime.episodes || 0);
  const releaseEpisodes = Number(release.episodes_total || 0);
  if (animeEpisodes && releaseEpisodes) {
    const episodeDiff = Math.abs(animeEpisodes - releaseEpisodes);
    if (episodeDiff === 0) {
      score += 5;
      hasCloseEpisodes = true;
    } else if (episodeDiff <= 1) {
      score += 3;
      hasCloseEpisodes = true;
    } else if (episodeDiff <= 3) {
      score += 1;
    } else if (episodeDiff > Math.max(4, animeEpisodes * 0.3)) {
      score -= 5;
    }
  }

  const isReliable = hasStrongTitle && (hasCloseYear || hasCloseEpisodes || (!anime.year && hasTypeMatch));
  return isReliable ? score : Math.min(score, 8);
}

async function fetchAniLibriaSearch(query: string): Promise<AniLibriaRelease[]> {
  const response = await fetch(`${anilibriaBase}/api/v1/app/search/releases?query=${encodeURIComponent(query)}`, {
    next: { revalidate: 60 * 60 },
    headers: {
      Accept: "application/json",
      "User-Agent": "Taytlo/0.1"
    }
  });
  if (!response.ok) throw new Error("AniLibria search failed");
  const payload = await response.json();
  return Array.isArray(payload) ? payload : payload.data || [];
}

async function fetchRelease(id: number): Promise<AniLibriaRelease> {
  const response = await fetch(`${anilibriaBase}/api/v1/anime/releases/${id}`, {
    next: { revalidate: 60 * 10 },
    headers: {
      Accept: "application/json",
      "User-Agent": "Taytlo/0.1"
    }
  });
  if (!response.ok) throw new Error("AniLibria release failed");
  return response.json();
}

async function resolveReleaseId(anime: Anime) {
  if (anime.aniLibriaReleaseId) return anime.aniLibriaReleaseId;

  const searchTerms = [anime.titleRu, anime.title].filter(Boolean);
  const releases: AniLibriaRelease[] = [];
  for (const term of searchTerms) {
    const found = await fetchAniLibriaSearch(term);
    releases.push(...found);
    if (found.length) break;
  }

  const ranked = releases
    .map((release) => ({ release, score: matchScore(anime, release) }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.score >= 14 ? ranked[0].release.id : 0;
}

export async function getAniLibriaEpisodes(slug: string): Promise<AniLibriaEpisodesResult> {
  const anime = getAnimeBySlug(slug);
  if (!anime) {
    return { state: "empty", episodes: [], message: "Тайтл не найден" };
  }

  try {
    const releaseId = await resolveReleaseId(anime);
    if (!releaseId) {
      return { state: "empty", episodes: [], message: "Серии пока недоступны" };
    }

    const release = await fetchRelease(releaseId);
    const officialUrl = releaseUrl(release);
    const episodes: AniLibriaEpisode[] = (release.episodes || [])
      .map((episode, index) => {
        const ordinal = Number(episode.ordinal);
        const number = Number.isFinite(ordinal) && ordinal > 0 ? ordinal : index + 1;
        return {
          id: episode.id || `${release.id}-${number}`,
          number,
          title: episode.name || episode.name_english || "",
          hlsUrl: absoluteAniLibriaUrl(episode.hls_1080 || episode.hls_720 || episode.hls_480 || ""),
          fallbackUrl: officialUrl,
          duration: Number(episode.duration || 0) || null
        };
      })
      .sort((left, right) => left.number - right.number);

    return {
      state: episodes.length ? "ready" : "empty",
      releaseId: release.id,
      releaseName: release.name?.main || anime.titleRu,
      releaseUrl: officialUrl,
      firstEpisode: episodes[0]?.number,
      lastEpisode: episodes.at(-1)?.number,
      expectedEpisodes: Number(release.episodes_total || anime.episodes || 0) || undefined,
      isOngoing: Boolean(release.is_ongoing),
      episodes,
      message: episodes.length ? undefined : "Серии пока недоступны"
    };
  } catch (error) {
    return {
      state: "error",
      episodes: [],
      message: error instanceof Error ? error.message : "Не удалось загрузить серии"
    };
  }
}

import Link from "next/link";
import type { Anime } from "@/lib/types";
import { RatingBadge } from "./RatingBadge";
import { SafeImage } from "./SafeImage";

function episodeMeta(anime: Anime) {
  if (anime.episodes && anime.episodes > 0) return `${anime.episodes} серий`;

  const type = anime.type.toLocaleLowerCase("ru");
  if (type.includes("movie") || type.includes("фильм")) return "фильм";
  if (type.includes("special") || type.includes("спец")) return "спецвыпуск";
  if (type.includes("ova") || type.includes("ona")) return anime.type;

  return "серии уточняются";
}

function yearMeta(anime: Anime) {
  return anime.year ? String(anime.year) : "год уточняется";
}

export function AnimeCard({ anime }: { anime: Anime }) {
  const chipLabel = anime.genres[0] || anime.franchise;
  const hasEpisodes = Boolean(anime.aniLibriaReleaseId);

  return (
    <article className="anime-card">
      <Link className="poster-link" href={`/anime/${anime.slug}`} aria-label={anime.titleRu}>
        <SafeImage src={anime.image} alt={anime.titleRu} loading="lazy" />
      </Link>
      <div className="card-body">
        <Link className="card-title" href={`/anime/${anime.slug}`}>
          {anime.titleRu}
        </Link>
        <p className="card-meta">
          {anime.type} · {yearMeta(anime)} · {episodeMeta(anime)}
        </p>
        <div className="card-bottom">
          <RatingBadge rating={anime.shikimori} />
          <div className="card-chip-row">
            <span className="card-chip" title={chipLabel}>
              {chipLabel}
            </span>
            {hasEpisodes ? (
              <span className="card-chip card-chip-stream" title="Серии доступны через AniLibria">
                Серии
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import type { Anime } from "@/lib/types";
import { RatingBadge } from "./RatingBadge";
import { SafeImage } from "./SafeImage";

export function AnimeCard({ anime }: { anime: Anime }) {
  const chipLabel = anime.genres[0] || anime.franchise;

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
          {anime.type} · {anime.year || "год неизвестен"} · {anime.episodes || "?"} серий
        </p>
        <div className="card-bottom">
          <RatingBadge rating={anime.shikimori} />
          <span className="card-chip" title={chipLabel}>
            {chipLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

import type { ShikimoriRating } from "@/lib/types";

export function RatingBadge({ rating }: { rating: ShikimoriRating | null }) {
  if (!rating?.score) {
    return (
      <span className="rating rating-muted" title="Оценка Shikimori недоступна">
        <span className="rating-source">SH</span>
        <span>нет оценки</span>
      </span>
    );
  }

  return (
    <span className="rating" title={rating.votes ? `${rating.votes.toLocaleString("ru-RU")} оценок Shikimori` : "Shikimori"}>
      <span aria-hidden="true">★</span>
      <span>{rating.score.toFixed(2)}</span>
      <small>SH</small>
    </span>
  );
}

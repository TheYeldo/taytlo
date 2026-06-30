import type { ShikimoriRating } from "@/lib/types";

export function RatingBadge({ rating }: { rating: ShikimoriRating | null }) {
  if (!rating?.score) {
    return <span className="rating rating-muted">SH недоступно</span>;
  }

  return (
    <span className="rating" title={rating.votes ? `${rating.votes.toLocaleString("ru-RU")} оценок` : "Shikimori"}>
      <span aria-hidden="true">★</span>
      <span>{rating.score.toFixed(2)}</span>
      <small>SH</small>
    </span>
  );
}

import type { Anime } from "@/lib/types";

function itemLabel(anime: Anime) {
  return `${anime.type || "Anime"} · ${anime.year || "?"} · ${anime.episodes || "?"} серий`;
}

export function FranchiseTimeline({ currentId, items }: { currentId: string; items: Anime[] }) {
  if (items.length < 2) return null;

  return (
    <section className="franchise-next">
      <div className="section-title">
        <span>Франшиза</span>
        <h2>Порядок просмотра</h2>
      </div>
      <div className="franchise-next-list">
        {items.map((anime, index) => (
          <a href={`/anime/${anime.slug}`} className={anime.id === currentId ? "franchise-next-item is-current" : "franchise-next-item"} key={anime.id}>
            <span>{index + 1}</span>
            <strong>{anime.titleRu}</strong>
            <small>{anime.id === currentId ? "Сейчас" : itemLabel(anime)}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

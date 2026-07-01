import Link from "next/link";
import type { Anime } from "@/lib/types";
import { SafeImage } from "./SafeImage";

type DiscoveryGroup = {
  eyebrow: string;
  title: string;
  note: string;
  genres: string[];
};

const groups: DiscoveryGroup[] = [
  {
    eyebrow: "Включить сейчас",
    title: "Экшен и большие арки",
    note: "Когда хочется темпа, сражений и длинной истории.",
    genres: ["Экшен", "Сёнен", "Сёнэн", "Боевые искусства", "Супер сила"]
  },
  {
    eyebrow: "Спокойный вечер",
    title: "Романтика и школа",
    note: "Для лёгкого просмотра без тяжёлого входа.",
    genres: ["Романтика", "Комедия", "Школа", "Повседневность"]
  },
  {
    eyebrow: "Зацепиться сюжетом",
    title: "Мистика, детектив, триллер",
    note: "Тайтлы, где интересно разбирать детали.",
    genres: ["Детектив", "Мистика", "Триллер", "Психология", "Психологическое"]
  },
  {
    eyebrow: "Другой мир",
    title: "Фэнтези и приключения",
    note: "Магия, путешествия и странные правила мира.",
    genres: ["Фэнтези", "Приключения", "Магия", "Сверхъестественное"]
  }
];

function score(anime: Anime) {
  return (anime.shikimori?.score || 0) * 1000 + anime.popularityBase + anime.requestBase;
}

function pickByGenres(catalog: Anime[], genres: string[]) {
  const wanted = new Set(genres);
  return catalog
    .filter((anime) => anime.genres.some((genre) => wanted.has(genre)))
    .sort((left, right) => score(right) - score(left))
    .slice(0, 3);
}

export function HomeDiscovery({ catalog }: { catalog: Anime[] }) {
  const shelves = groups
    .map((group) => ({ ...group, items: pickByGenres(catalog, group.genres) }))
    .filter((group) => group.items.length);

  if (!shelves.length) return null;

  return (
    <section className="content-section discovery-section">
      <div className="section-title">
        <span>Подборки</span>
        <h2>Что включить сегодня</h2>
      </div>
      <div className="discovery-grid">
        {shelves.map((group) => {
          const mainGenre = group.genres[0];
          return (
            <article className="discovery-card" key={group.title}>
              <div className="discovery-copy">
                <span>{group.eyebrow}</span>
                <h3>{group.title}</h3>
                <p>{group.note}</p>
              </div>
              <div className="discovery-list">
                {group.items.map((anime) => (
                  <Link href={`/anime/${anime.slug}`} className="discovery-item" key={`${group.title}-${anime.id}`}>
                    <SafeImage src={anime.image} alt={anime.titleRu} loading="lazy" />
                    <span>
                      <strong>{anime.titleRu}</strong>
                      <small>{anime.shikimori?.score ? `${anime.shikimori.score.toFixed(2)} SH` : anime.year || "без оценки"}</small>
                    </span>
                  </Link>
                ))}
              </div>
              <Link className="discovery-link" href={`/?genre=${encodeURIComponent(mainGenre)}#catalog`}>
                Открыть подборку
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

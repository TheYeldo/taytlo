import type { Anime } from "@/lib/types";
import { SafeImage } from "./SafeImage";

type Collection = {
  title: string;
  eyebrow: string;
  note: string;
  items: Anime[];
  metric: (anime: Anime, index: number) => string;
};

function compact(value: number) {
  return new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function CollectionShelf({ collection }: { collection: Collection }) {
  return (
    <section className="content-section">
      <div className="section-title">
        <span>{collection.eyebrow}</span>
        <h2>{collection.title}</h2>
      </div>
      <p className="section-note">{collection.note}</p>
      <div className="collection-rail">
        {collection.items.map((anime, index) => (
          <a href={`/anime/${anime.slug}`} className="collection-card" key={`${collection.title}-${anime.id}`}>
            <span className="collection-rank">{index + 1}</span>
            <SafeImage src={anime.image} alt={anime.titleRu} loading="lazy" />
            <span className="collection-copy">
              <strong>{anime.titleRu}</strong>
              <small>{collection.metric(anime, index)}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function HomeCollections({ catalog }: { catalog: Anime[] }) {
  const byRequests = [...catalog].sort((left, right) => right.requestBase - left.requestBase).slice(0, 5);
  const updates = [...catalog]
    .sort((left, right) => {
      const yearDiff = (right.year || 0) - (left.year || 0);
      return yearDiff || right.popularityBase - left.popularityBase;
    })
    .slice(0, 6);
  const popular = [...catalog].sort((left, right) => right.popularityBase - left.popularityBase).slice(0, 6);

  const collections: Collection[] = [
    {
      eyebrow: "Топ запросов",
      title: "Пять топовых аниме по запросам пользователей",
      note: "Быстрая витрина того, что чаще всего ищут и открывают на Taytlo.",
      items: byRequests,
      metric: (anime) => `${compact(anime.requestBase)} запросов`
    },
    {
      eyebrow: "Обновления",
      title: "Актуальные тайтлы для просмотра",
      note: "Свежие сезоны, новые карточки и тайтлы, которые стоит открыть первыми.",
      items: updates,
      metric: (anime) => `${anime.year || "?"} · ${anime.episodes || "?"} серий`
    },
    {
      eyebrow: "Популярное",
      title: "Самые популярные тайтлы за всё время",
      note: "Большие франшизы и сериалы, которые стабильно смотрят и добавляют в списки.",
      items: popular,
      metric: (anime) => `${compact(anime.popularityBase)} просмотров`
    }
  ];

  return (
    <>
      {collections.map((collection) => (
        <CollectionShelf collection={collection} key={collection.title} />
      ))}
    </>
  );
}

import Link from "next/link";
import type { CSSProperties } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import { ExplorePanel } from "@/components/ExplorePanel";
import { HomeCollections } from "@/components/HomeCollections";
import { HomeDiscovery } from "@/components/HomeDiscovery";
import { HomeWatchHub } from "@/components/HomeWatchHub";
import { SearchFilters } from "@/components/SearchFilters";
import { SectionTitle } from "@/components/SectionTitle";
import SplitText from "@/components/SplitText";
import { getCatalog, getCatalogStats, getFranchises, getGenres, queryCatalog } from "@/lib/catalog";
import { getUpcomingSchedule } from "@/lib/schedule";
import type { CatalogQuery } from "@/lib/types";

type HomeProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateLabel(value: string | undefined) {
  if (!value) return "Дата уточняется";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточняется";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);
}

function episodeLabel(item: { episodeNumber?: number; episode?: number }) {
  const episodeNumber = item.episodeNumber || item.episode;
  return episodeNumber ? `Серия ${episodeNumber}` : "Номер серии уточняется";
}

export default function HomePage({ searchParams }: HomeProps) {
  const catalog = getCatalog();
  const query: CatalogQuery = {
    search: first(searchParams.search),
    genre: first(searchParams.genre),
    franchise: first(searchParams.franchise),
    sort: (first(searchParams.sort) as CatalogQuery["sort"]) || "popular",
    limit: Number(first(searchParams.limit) || 24),
    page: 1
  };
  const result = queryCatalog(query);
  const stats = getCatalogStats();
  const schedule = getUpcomingSchedule(6);
  const popular = queryCatalog({ sort: "rating", limit: 5 }).items;
  const spotlight = queryCatalog({ sort: "rating", limit: 3 }).items;
  const genreStats = getGenres().map((genre) => ({
    name: genre,
    count: catalog.filter((anime) => anime.genres.includes(genre)).length
  }));
  const franchiseStats = getFranchises().map((franchise) => ({
    name: franchise,
    count: catalog.filter((anime) => anime.franchise === franchise).length
  }));
  const nextLimit = Math.min((query.limit || 24) + 24, result.total);
  const loadMoreParams = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, limit: nextLimit })) {
    if (value) loadMoreParams.set(key, String(value));
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="hero-copy">
          <p className="eyebrow">anime catalog / shikimori / anilibria</p>
          <SplitText tag="h1" text="Taytlo" splitType="chars" delay={58} duration={0.92} textAlign="left" />
          <p>
            Удобный каталог аниме с нормальными страницами тайтлов, рейтингами Shikimori, календарем выхода серий,
            избранным, историей просмотра и подборками под настроение.
          </p>
          <form className="hero-search" action="/" method="get">
            <input name="search" placeholder="Найти аниме, жанр или франшизу" />
            <button type="submit">Найти</button>
          </form>
          <div className="hero-actions">
            <a href="#catalog">Смотреть каталог</a>
            <a href="#schedule">Календарь серий</a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Популярные тайтлы">
          <div className="hero-visual-head">
            <span>Сейчас выбирают</span>
            <strong>{stats.total} тайтлов</strong>
          </div>
          <div className="hero-poster-stack">
            {spotlight.map((anime, index) => (
              <Link href={`/anime/${anime.slug}`} className="hero-poster-card" key={anime.id} style={{ "--shift": `${index * 16}px` } as CSSProperties & Record<"--shift", string>}>
                <img src={anime.image || "/assets/fallback-poster.svg"} alt={anime.titleRu} />
                <span>
                  <strong>{anime.titleRu}</strong>
                  <small>{anime.shikimori?.score ? `SH ${anime.shikimori.score.toFixed(2)}` : anime.year || "Taytlo"}</small>
                </span>
              </Link>
            ))}
          </div>
          <div className="hero-stats" aria-label="Статистика каталога">
            <span>
              <strong>{stats.total}</strong>
              аниме
            </span>
            <span>
              <strong>{stats.withRating}</strong>
              с оценками
            </span>
            <span>
              <strong>{stats.franchises}</strong>
              франшиз
            </span>
          </div>
        </div>
      </section>

      <HomeWatchHub catalog={catalog} />
      <HomeDiscovery catalog={catalog} />
      <ExplorePanel genres={genreStats} franchises={franchiseStats} />

      <section className="content-section catalog-section" id="catalog">
        <SectionTitle eyebrow="Каталог" title="Найди, что посмотреть" />
        <SearchFilters genres={getGenres()} franchises={getFranchises()} query={query} />
        {result.items.length ? (
          <>
            <div className="anime-grid">
              {result.items.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
            {result.hasMore ? (
              <div className="load-more">
                <Link href={`/?${loadMoreParams.toString()}#catalog`}>Показать ещё</Link>
              </div>
            ) : null}
          </>
        ) : (
          <p className="empty">Ничего не найдено</p>
        )}
      </section>

      <HomeCollections catalog={catalog} />

      <section className="split-section" id="schedule">
        <div>
          <SectionTitle eyebrow="Календарь" title="Ближайшие серии" />
          <div className="schedule-list">
            {schedule.length ? (
              schedule.map((item, index) => {
                const hasEpisodeNumber = Boolean(item.episodeNumber || item.episode);
                return (
                  <article key={`${item.titleRu || item.title}-${index}`} className="schedule-item">
                    <span>{dateLabel(item.airAt || item.nextEpisodeAt)}</span>
                    <strong>{item.titleRu || item.title || "Аниме"}</strong>
                    <small className={hasEpisodeNumber ? undefined : "is-episode-unknown"}>{episodeLabel(item)}</small>
                  </article>
                );
              })
            ) : (
              <p className="empty">Пока нет ближайших дат</p>
            )}
          </div>
        </div>
        <div id="popular">
          <SectionTitle eyebrow="Топ" title="Высокий рейтинг Shikimori" />
          <div className="top-list">
            {popular.map((anime, index) => (
              <Link key={anime.id} href={`/anime/${anime.slug}`} className="top-item">
                <span>{index + 1}</span>
                <strong>{anime.titleRu}</strong>
                <small>{anime.shikimori?.score?.toFixed(2) || "без оценки"}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

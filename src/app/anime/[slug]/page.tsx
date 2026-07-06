import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimeCard } from "@/components/AnimeCard";
import { EpisodePlayer } from "@/components/EpisodePlayer";
import { FranchiseTimeline } from "@/components/FranchiseTimeline";
import { NextEpisodeCountdown } from "@/components/NextEpisodeCountdown";
import { RatingBadge } from "@/components/RatingBadge";
import { SafeImage } from "@/components/SafeImage";
import SplitText from "@/components/SplitText";
import { UserLibraryControls } from "@/components/UserLibraryControls";
import { getAnimeBySlug, getCatalog, getRelatedAnime } from "@/lib/catalog";
import { animeDescription, animeJsonLd, animeSynopsis, siteName, siteUrl } from "@/lib/seo";
import { getUpcomingSchedule } from "@/lib/schedule";
import type { Anime } from "@/lib/types";

type AnimePageProps = {
  params: {
    slug: string;
  };
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.max(0, Math.round(value)));
}

function formatDate(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  return new Intl.DateTimeFormat("ru", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(time));
}

function episodeCountLabel(anime: Anime) {
  if (anime.episodes && anime.episodes > 0) return `${anime.episodes} серий`;

  const type = anime.type.toLocaleLowerCase("ru");
  if (type.includes("movie") || type.includes("фильм")) return "полнометражный фильм";
  if (type.includes("special") || type.includes("спец")) return "спецвыпуск";
  if (type.includes("ova") || type.includes("ona")) return anime.type;

  return "серии уточняются";
}

function releaseLabel(anime: Anime) {
  return anime.aniLibriaReleaseId ? "серии доступны через AniLibria" : "серии проверяются по легальным источникам";
}

function nextEpisodeLabel(nextEpisode: ReturnType<typeof findNextEpisode>) {
  if (!(nextEpisode?.airAt || nextEpisode?.nextEpisodeAt)) return "актуального анонса нет";
  const episode = nextEpisode.episodeNumber || nextEpisode.episode;
  const date = formatDate(nextEpisode.airAt || nextEpisode.nextEpisodeAt || "");
  return episode ? `${episode} серия · ${date}` : `дата выхода · ${date}`;
}

function breadcrumbJsonLd(anime: Anime) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteName,
        item: siteUrl()
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог аниме",
        item: `${siteUrl()}/#catalog`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: anime.titleRu,
        item: `${siteUrl()}/anime/${anime.slug}`
      }
    ]
  };
}

function makeInfoRows(anime: Anime, nextEpisode: ReturnType<typeof findNextEpisode>) {
  return [
    ["Тип", anime.type || "Аниме"],
    ["Год", anime.year ? String(anime.year) : "Неизвестно"],
    ["Серии", episodeCountLabel(anime)],
    ["Статус", anime.status || "Неизвестно"],
    ["Франшиза", anime.franchise || "Отдельный тайтл"],
    ["Жанры", anime.genres.join(", ") || "Жанры уточняются"],
    ["Озвучка/релиз", releaseLabel(anime)],
    [
      "Shikimori",
      anime.shikimori?.score
        ? `${anime.shikimori.score.toFixed(2)}${anime.shikimori.votes ? ` · ${formatNumber(anime.shikimori.votes)} оценок` : ""}`
        : "Оценка недоступна"
    ],
    [
      "Следующая серия",
      nextEpisodeLabel(nextEpisode)
    ]
  ];
}

function findNextEpisode(anime: Anime) {
  const normalizedTitle = anime.titleRu.toLocaleLowerCase("ru");
  return (
    getUpcomingSchedule(80).find((item) => {
      if (item.animeSlug && item.animeSlug === anime.slug) return true;
      const itemTitle = String(item.titleRu || item.title || "").toLocaleLowerCase("ru");
      return Boolean(itemTitle && (itemTitle.includes(normalizedTitle) || normalizedTitle.includes(itemTitle)));
    }) || null
  );
}

function activityBars(anime: Anime) {
  const base = Math.max(24, anime.popularityBase + anime.requestBase + Math.round((anime.shikimori?.score || 6) * 12));
  const rows = [
    { label: "Смотрят", value: Math.round(base * 0.46), color: "green" },
    { label: "Будут смотреть", value: Math.round(base * 0.34), color: "pink" },
    { label: "Просмотрено", value: Math.round(base * 0.26), color: "orange" },
    { label: "Брошено", value: Math.max(1, Math.round(base * 0.06)), color: "purple" },
    { label: "Любимое", value: Math.round(base * 0.2), color: "mint" }
  ];
  const max = Math.max(...rows.map((row) => row.value));
  return rows.map((row) => ({ ...row, width: `${Math.max(8, (row.value / max) * 100)}%` }));
}

function ratingBars(anime: Anime) {
  const score = anime.shikimori?.score || 0;
  return [
    { label: "5", width: `${score ? Math.min(92, Math.max(36, score * 10.5)) : 14}%` },
    { label: "4", width: `${score ? Math.max(12, (10 - Math.abs(score - 7.5)) * 4.2) : 8}%` },
    { label: "3", width: `${score ? Math.max(8, (10 - Math.abs(score - 6)) * 2.6) : 7}%` },
    { label: "2", width: `${score ? Math.max(5, (10 - Math.abs(score - 4.5)) * 1.5) : 5}%` },
    { label: "1", width: "5%" }
  ];
}

export function generateStaticParams() {
  return getCatalog().map((anime) => ({ slug: anime.slug }));
}

export function generateMetadata({ params }: AnimePageProps): Metadata {
  const anime = getAnimeBySlug(params.slug);
  if (!anime) return {};
  const url = `${siteUrl()}/anime/${anime.slug}`;
  const description = animeDescription(anime);
  const image = anime.image.startsWith("http") ? anime.image : `${siteUrl()}${anime.image}`;

  return {
    title: `${anime.titleRu} смотреть онлайн, рейтинг и серии`,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: `${anime.titleRu} | ${siteName}`,
      description,
      url,
      siteName,
      images: [{ url: image, alt: anime.titleRu }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${anime.titleRu} | ${siteName}`,
      description,
      images: [image]
    }
  };
}

export default function AnimePage({ params }: AnimePageProps) {
  const anime = getAnimeBySlug(params.slug);
  if (!anime) notFound();

  const related = getRelatedAnime(anime, 6);
  const franchiseItems = getCatalog()
    .filter((item) => item.franchise === anime.franchise)
    .sort((left, right) => (left.year || 0) - (right.year || 0) || (left.episodes || 0) - (right.episodes || 0));
  const nextEpisode = findNextEpisode(anime);
  const jsonLd = animeJsonLd(anime);
  const synopsis = animeSynopsis(anime);
  const infoRows = makeInfoRows(anime, nextEpisode);
  const activity = activityBars(anime);
  const ratingDistribution = ratingBars(anime);
  const nextEpisodeAt = nextEpisode?.airAt || nextEpisode?.nextEpisodeAt || "";
  const hasAniLibriaEpisodes = Boolean(anime.aniLibriaReleaseId);
  const structuredData = [jsonLd, breadcrumbJsonLd(anime)];

  return (
    <main className="anime-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <section className="anime-detail-hero">
        <div className="detail-poster-column">
          <div className="detail-poster-frame">
            <SafeImage className="detail-poster" src={anime.image} alt={anime.titleRu} />
            <span>{episodeCountLabel(anime)}</span>
          </div>
          <a className="detail-watch-cta" href="#episodes">
            {hasAniLibriaEpisodes ? "Смотреть серии" : "Проверить серии"}
          </a>
          {anime.aniLibriaReleaseId ? (
            <a className="detail-source-cta" href={`https://anilibria.top/release/id${anime.aniLibriaReleaseId}.html`} target="_blank" rel="noreferrer">
              Открыть на AniLibria
            </a>
          ) : null}
        </div>

        <div className="detail-info-column">
          <nav className="detail-breadcrumbs" aria-label="Навигация по странице">
            <Link href="/">Taytlo</Link>
            <span>/</span>
            <Link href="/#catalog">Каталог</Link>
            {anime.franchise ? (
              <>
                <span>/</span>
                <Link href={`/?franchise=${encodeURIComponent(anime.franchise)}#catalog`}>{anime.franchise}</Link>
              </>
            ) : null}
          </nav>
          <div className="detail-title-row">
            <RatingBadge rating={anime.shikimori} />
            <div>
              <SplitText tag="h1" text={anime.titleRu} splitType="words" delay={24} duration={0.72} textAlign="left" />
              <p>{anime.title}</p>
            </div>
          </div>

          <div className="detail-mini-stats" aria-label="Краткая информация">
            <span>
              <strong>{anime.type || "TV"}</strong>
              формат
            </span>
            <span>
              <strong>{anime.year || "?"}</strong>
              год
            </span>
            <span>
              <strong>{formatNumber(anime.popularityBase + anime.requestBase)}</strong>
              индекс интереса
            </span>
            <span>
              <strong>{anime.shikimori?.votes ? formatNumber(anime.shikimori.votes) : "SH"}</strong>
              оценок Shikimori
            </span>
          </div>

          <div className="detail-info-card">
            {infoRows.map(([label, value]) => (
              <p key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </p>
            ))}
          </div>

          <div className="tag-row detail-tags">
            {anime.genres.map((genre) => (
              <Link key={genre} href={`/?genre=${encodeURIComponent(genre)}#catalog`}>
                {genre}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-description-card">
        <span>Описание</span>
        <p>{synopsis}</p>
      </section>

      {nextEpisodeAt ? <NextEpisodeCountdown airAt={nextEpisodeAt} episodeNumber={nextEpisode?.episodeNumber || nextEpisode?.episode || null} /> : null}

      <UserLibraryControls anime={{ id: anime.id, slug: anime.slug, titleRu: anime.titleRu }} />
      <FranchiseTimeline currentId={anime.id} items={franchiseItems} />
      <EpisodePlayer anime={{ id: anime.id, slug: anime.slug, titleRu: anime.titleRu }} />

      <section className="detail-stats-section">
        <div className="section-title">
          <span>Статистика</span>
          <h2>Активность тайтла</h2>
        </div>
        <div className="detail-stats-grid">
          <article className="detail-activity-card">
            {activity.map((row) => (
              <div className={`activity-row activity-row-${row.color}`} key={row.label}>
                <span className={`activity-dot activity-dot-${row.color}`} />
                <strong>{row.label}</strong>
                <div>
                  <i style={{ width: row.width }} />
                </div>
                <small>{formatNumber(row.value)}</small>
              </div>
            ))}
          </article>
          <article className="detail-rating-card">
            <div className="rating-orb">
              <strong>{anime.shikimori?.score ? anime.shikimori.score.toFixed(1) : "—"}</strong>
              <span>Shikimori</span>
            </div>
            <div className="rating-bars">
              {ratingDistribution.map((row) => (
                <p key={row.label}>
                  <span>{row.label}</span>
                  <i>
                    <b style={{ width: row.width }} />
                  </i>
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="content-section">
        <div className="section-title">
          <span>Персонажи</span>
          <h2>Герои и состав</h2>
        </div>
        {anime.characters.length ? (
          <div className="character-grid">
            {anime.characters.map((character) => (
              <article className="character-card" key={character.id}>
                <SafeImage src={character.image} alt={character.name} loading="lazy" />
                <strong>{character.name}</strong>
                <span>{character.role}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">Персонажи пока не добавлены</p>
        )}
      </section>

      <section className="content-section">
        <div className="section-title">
          <span>Похожее</span>
          <h2>Можно посмотреть дальше</h2>
        </div>
        <div className="anime-grid compact-grid">
          {related.map((item) => (
            <AnimeCard key={item.id} anime={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

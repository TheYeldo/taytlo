import { isAdminTokenValid } from "@/lib/admin";
import { activeStoreName } from "@/lib/account-store";
import { getCatalogStats } from "@/lib/catalog";
import { getUpcomingSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: {
    token?: string;
  };
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата неизвестна";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function AdminPage({ searchParams }: AdminPageProps) {
  const allowed = isAdminTokenValid(searchParams.token);

  if (!allowed) {
    return (
      <main className="admin-shell">
        <section className="admin-panel">
          <p className="eyebrow">admin</p>
          <h1>Закрытая зона Taytlo</h1>
          <p>Эта страница защищена серверным `ADMIN_TOKEN`. Без токена данные админки не показываются.</p>
        </section>
      </main>
    );
  }

  const stats = getCatalogStats();
  const schedule = getUpcomingSchedule(50);
  const storeName = activeStoreName();
  const ratingCoverage = stats.total ? stats.withRating / stats.total : 0;
  const checks = [
    { label: "ADMIN_TOKEN", ok: Boolean(process.env.ADMIN_TOKEN), note: "админка закрыта токеном" },
    { label: "Хранилище", ok: storeName === "prisma", note: storeName === "prisma" ? "подключена база данных" : "локальный dev JSON" },
    { label: "Shikimori", ok: stats.withRating > 0, note: `${stats.withRating} тайтлов с рейтингом` },
    { label: "Календарь", ok: schedule.length > 0, note: `${schedule.length} будущих серий` },
    { label: "SITE_URL", ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL), note: process.env.NEXT_PUBLIC_SITE_URL || "не задан" }
  ];

  return (
    <main className="admin-shell admin-dashboard">
      <section className="admin-panel">
        <p className="eyebrow">admin</p>
        <h1>Панель состояния Taytlo</h1>
        <p>Быстрый контроль перед деплоем: каталог, рейтинги, календарь, storage и переменные окружения.</p>

        <div className="admin-grid">
          <span>
            <strong>{stats.total}</strong>
            аниме
          </span>
          <span>
            <strong>{formatPercent(ratingCoverage)}</strong>
            покрытие Shikimori
          </span>
          <span>
            <strong>{stats.franchises}</strong>
            франшиз
          </span>
          <span>
            <strong>{schedule.length}</strong>
            будущих серий
          </span>
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-title">
          <span>Готовность</span>
          <h2>Что включено сейчас</h2>
        </div>
        <div className="admin-checklist">
          {checks.map((check) => (
            <p key={check.label} className={check.ok ? "is-ok" : "is-warning"}>
              <b>{check.ok ? "OK" : "!"}</b>
              <span>{check.label}</span>
              <small>{check.note}</small>
            </p>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-title">
          <span>Календарь</span>
          <h2>Ближайшие серии</h2>
        </div>
        <div className="admin-list">
          {schedule.slice(0, 8).map((item) => (
            <a href={`/anime/${item.animeSlug}`} key={`${item.animeSlug}-${item.episodeNumber || item.episode || item.airAt}`} className="admin-list-item">
              <strong>{item.titleRu || item.title}</strong>
              <span>
                Серия {item.episodeNumber || item.episode || "?"} · {formatDate(item.airAt || item.nextEpisodeAt || "")}
              </span>
            </a>
          ))}
          {!schedule.length ? <p className="empty">В календаре пока нет будущих серий</p> : null}
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-title">
          <span>Деплой</span>
          <h2>Следующий шаг</h2>
        </div>
        <p>
          Для продакшена нужен `DATABASE_URL` от Neon/Postgres и `TAYTLO_STORE=prisma` в Vercel. Тогда аккаунты,
          история, комментарии и списки будут храниться на сервере, а не в локальном JSON.
        </p>
      </section>
    </main>
  );
}

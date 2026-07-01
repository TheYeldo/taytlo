"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SafeImage } from "./SafeImage";
import type { Anime } from "@/lib/types";

type HubAnime = Pick<Anime, "id" | "slug" | "titleRu" | "image" | "shikimori" | "genres">;

type HistoryEntry = {
  animeId: string;
  slug: string;
  titleRu: string;
  episodeTitle: string;
  seconds: number;
  updatedAt: string;
};

const storage = {
  favorites: "taytlo-next:favorites",
  history: "taytlo-next:watchHistory",
  statuses: "taytlo-next:watchStatuses"
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function HomeWatchHub({ catalog }: { catalog: HubAnime[] }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const refresh = () => {
      setHistory(readJson<HistoryEntry[]>(storage.history, []));
      setFavorites(readJson<string[]>(storage.favorites, []));
      setStatuses(readJson<Record<string, string>>(storage.statuses, {}));
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("taytlo-library-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("taytlo-library-change", refresh);
    };
  }, []);

  const cards = useMemo(() => {
    const byId = new Map(catalog.map((anime) => [anime.id, anime]));
    const latest = history[0];
    const favoriteAnime = favorites.map((id) => byId.get(id)).find(Boolean);
    const watchingAnime = Object.entries(statuses)
      .filter(([, status]) => status === "watching" || status === "planned")
      .map(([id]) => byId.get(id))
      .find(Boolean);
    const top = catalog.filter((anime) => anime.shikimori?.score).slice(0, 3);

    return [
      latest && {
        key: "continue",
        anime: byId.get(latest.animeId) || { id: latest.animeId, slug: latest.slug, titleRu: latest.titleRu, image: "", shikimori: null, genres: [] },
        eyebrow: "Продолжить",
        note: `${latest.episodeTitle} · ${formatTime(latest.seconds)}`
      },
      favoriteAnime && {
        key: "favorite",
        anime: favoriteAnime,
        eyebrow: "Избранное",
        note: "Быстрый доступ к любимому тайтлу"
      },
      watchingAnime && {
        key: "list",
        anime: watchingAnime,
        eyebrow: "Мой список",
        note: "Вернуться к списку просмотра"
      },
      ...top.map((anime, index) => ({
        key: `top-${anime.id}`,
        anime,
        eyebrow: index === 0 ? "Совет дня" : "Рекомендация",
        note: anime.genres.slice(0, 2).join(" · ") || "Высокий рейтинг Shikimori"
      }))
    ].filter(Boolean).slice(0, 4) as Array<{ key: string; anime: HubAnime; eyebrow: string; note: string }>;
  }, [catalog, favorites, history, statuses]);

  return (
    <section className="watch-hub-next">
      <div className="section-title">
        <span>Мой просмотр</span>
        <h2>Продолжить и выбрать дальше</h2>
      </div>
      <div className="watch-hub-grid">
        {cards.map((card) => (
          <Link href={`/anime/${card.anime.slug}#episodes`} className="watch-hub-next-card" key={card.key}>
            <SafeImage src={card.anime.image} alt={card.anime.titleRu} />
            <span>
              <small>{card.eyebrow}</small>
              <strong>{card.anime.titleRu}</strong>
              <em>{card.note}</em>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

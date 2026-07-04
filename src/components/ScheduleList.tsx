"use client";

import { useEffect, useState } from "react";
import type { ScheduleItem } from "@/lib/schedule";

type ScheduleListProps = {
  initialItems: ScheduleItem[];
  limit?: number;
};

type ScheduleResponse = {
  items?: ScheduleItem[];
  source?: string;
  updatedAt?: string;
  error?: string;
};

const moscowDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Moscow"
});

function dateLabel(value: string | undefined) {
  if (!value) return "Дата уточняется";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата уточняется";
  return `${moscowDateFormatter.format(date)} МСК`;
}

function episodeLabel(item: ScheduleItem) {
  const episodeNumber = item.episodeNumber || item.episode;
  return episodeNumber ? `Серия ${episodeNumber}` : "Номер серии уточняется";
}

export function ScheduleList({ initialItems, limit = 6 }: ScheduleListProps) {
  const [items, setItems] = useState(initialItems);
  const [source, setSource] = useState(initialItems.length ? "cache" : "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadSchedule() {
      try {
        const response = await fetch(`/api/schedule?limit=${limit}`, { cache: "no-store" });
        if (!response.ok) throw new Error("schedule request failed");
        const data = (await response.json()) as ScheduleResponse;
        if (!isActive) return;

        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
        setSource(data.source || "");
        setError(data.error || "");
      } catch {
        if (isActive) {
          setError("Не удалось обновить календарь");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSchedule();
    return () => {
      isActive = false;
    };
  }, [limit]);

  return (
    <div className="schedule-list">
      <div className="schedule-status">
        <span>{source === "shikimori" ? "Данные Shikimori" : "Резервный календарь"}</span>
        {isLoading ? <small>Обновляем...</small> : null}
        {!isLoading && error ? <small>{error}</small> : null}
      </div>
      {items.length ? (
        items.map((item, index) => {
          const hasEpisodeNumber = Boolean(item.episodeNumber || item.episode);
          return (
            <article key={`${item.id || item.titleRu || item.title}-${index}`} className="schedule-item">
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
  );
}

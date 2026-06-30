"use client";

import { useEffect, useMemo, useState } from "react";

function getParts(targetTime: number) {
  const diff = Math.max(0, targetTime - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function NextEpisodeCountdown({ airAt, episodeNumber }: { airAt: string; episodeNumber?: number | null }) {
  const targetTime = useMemo(() => Date.parse(airAt), [airAt]);
  const [parts, setParts] = useState(() => getParts(targetTime));

  useEffect(() => {
    const timer = window.setInterval(() => setParts(getParts(targetTime)), 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  if (!Number.isFinite(targetTime)) return null;

  const dateLabel = new Intl.DateTimeFormat("ru", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(targetTime));

  return (
    <section className="next-episode-countdown" aria-label="Следующая серия">
      <div className="countdown-heading">
        <span>Следующая серия</span>
        <strong>{episodeNumber ? `Серия ${episodeNumber}` : "Дата выхода"}</strong>
        <small>{dateLabel}</small>
      </div>
      <div className="countdown-grid">
        <span>
          <strong>{String(parts.days).padStart(2, "0")}</strong>
          дней
        </span>
        <span>
          <strong>{String(parts.hours).padStart(2, "0")}</strong>
          часов
        </span>
        <span>
          <strong>{String(parts.minutes).padStart(2, "0")}</strong>
          минут
        </span>
        <span>
          <strong>{String(parts.seconds).padStart(2, "0")}</strong>
          секунд
        </span>
      </div>
    </section>
  );
}

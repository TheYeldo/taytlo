"use client";

import { useMemo, useState } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import type { Anime } from "@/lib/types";

const STEP = 24;

type Props = {
  items: Anime[];
  initialLimit: number;
};

function normalizeLimit(value: number, total: number) {
  const limit = Number.isFinite(value) ? value : STEP;
  return Math.min(Math.max(STEP, limit), Math.max(STEP, total));
}

function updateLimitUrl(limit: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("limit", String(limit));
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash || "#catalog"}`);
}

export function CatalogGrid({ items, initialLimit }: Props) {
  const [visibleCount, setVisibleCount] = useState(() => normalizeLimit(initialLimit, items.length));
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  function showMore() {
    setVisibleCount((current) => {
      const next = Math.min(current + STEP, items.length);
      updateLimitUrl(next);
      return next;
    });
  }

  return (
    <>
      <div className="anime-grid">
        {visibleItems.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
      {hasMore ? (
        <div className="load-more">
          <button type="button" onClick={showMore}>
            Показать ещё
          </button>
        </div>
      ) : null}
    </>
  );
}

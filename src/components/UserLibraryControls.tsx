"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MiniAnime = {
  id: string;
  slug: string;
  titleRu: string;
};

type ProgressEntry = {
  episodeNumber: number;
  episodeTitle: string;
  seconds: number;
  updatedAt: string;
};

type SyncState = "idle" | "saving" | "saved" | "local";

const storage = {
  favorites: "taytlo-next:favorites",
  watchStatuses: "taytlo-next:watchStatuses",
  progress: "taytlo-next:playbackProgress"
};

const statusLabels = {
  watching: "Смотрю",
  completed: "Посмотрел",
  dropped: "Брошено",
  planned: "Планирую"
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function uniqueFavorites(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

async function saveRemoteLibrary(patch: { favorites?: string[]; watchStatuses?: Record<string, string> }) {
  const response = await fetch("/api/me/library", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ library: patch })
  });

  if (!response.ok) throw new Error("Library is local only");
}

export function UserLibraryControls({ anime }: { anime: MiniAnime }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const syncResetTimer = useRef<number | null>(null);

  useEffect(() => {
    const readLocalState = () => {
      setFavorites(readJson<string[]>(storage.favorites, []));
      setStatuses(readJson<Record<string, string>>(storage.watchStatuses, {}));
      setProgress(readJson<Record<string, ProgressEntry>>(storage.progress, {}));
    };

    readLocalState();
    window.addEventListener("storage", readLocalState);
    window.addEventListener("taytlo-library-change", readLocalState);
    return () => {
      if (syncResetTimer.current) window.clearTimeout(syncResetTimer.current);
      window.removeEventListener("storage", readLocalState);
      window.removeEventListener("taytlo-library-change", readLocalState);
    };
  }, []);

  const isFavorite = favorites.includes(anime.id);
  const currentProgress = progress[anime.id];
  const status = statuses[anime.id] || "";
  const statusText = useMemo(() => (status ? statusLabels[status as keyof typeof statusLabels] || "Не в списке" : "Не в списке"), [status]);
  const syncText = {
    idle: "",
    saving: "Сохраняем...",
    saved: "Сохранено в аккаунте",
    local: "Сохранено локально"
  }[syncState];

  function dispatchLibraryChange() {
    window.dispatchEvent(new Event("taytlo-library-change"));
  }

  function markSyncState(nextState: SyncState) {
    setSyncState(nextState);
    if (syncResetTimer.current) window.clearTimeout(syncResetTimer.current);
    if (nextState === "saved" || nextState === "local") {
      syncResetTimer.current = window.setTimeout(() => setSyncState("idle"), 2600);
    }
  }

  async function persistRemote(patch: { favorites?: string[]; watchStatuses?: Record<string, string> }) {
    markSyncState("saving");
    try {
      await saveRemoteLibrary(patch);
      markSyncState("saved");
    } catch {
      markSyncState("local");
    }
  }

  function persistFavorites(nextFavorites: string[]) {
    const cleanFavorites = uniqueFavorites(nextFavorites);
    setFavorites(cleanFavorites);
    writeJson(storage.favorites, cleanFavorites);
    dispatchLibraryChange();
    void persistRemote({ favorites: cleanFavorites });
  }

  function toggleFavorite() {
    persistFavorites(isFavorite ? favorites.filter((id) => id !== anime.id) : [...favorites, anime.id]);
  }

  function updateStatus(value: string) {
    const next = { ...statuses };
    if (value) next[anime.id] = value;
    else delete next[anime.id];

    setStatuses(next);
    writeJson(storage.watchStatuses, next);
    dispatchLibraryChange();
    void persistRemote({ watchStatuses: next });
  }

  return (
    <section className="library-controls" aria-label="Личная библиотека">
      <div className="library-main">
        <button type="button" className={isFavorite ? "library-button is-active" : "library-button"} onClick={toggleFavorite}>
          {isFavorite ? "В избранном" : "В избранное"}
        </button>
        <label className="library-select">
          <span>Список</span>
          <select value={status} onChange={(event) => updateStatus(event.target.value)}>
            <option value="">Не в списке</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <a className="library-button primary" href="#episodes">
          {currentProgress ? "Продолжить" : "Смотреть"}
        </a>
      </div>
      <p className="library-hint">
        {currentProgress
          ? `Вы остановились: ${currentProgress.episodeTitle} · ${formatTime(currentProgress.seconds)}`
          : `Статус: ${statusText}. Прогресс появится после запуска серии.`}
        {syncText ? <span className="library-sync-state">{syncText}</span> : null}
      </p>
    </section>
  );
}

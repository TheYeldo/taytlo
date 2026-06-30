"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AniLibriaEpisode, AniLibriaEpisodesResult } from "@/lib/types";

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

type HistoryEntry = ProgressEntry & {
  animeId: string;
  slug: string;
  titleRu: string;
};

type EpisodeComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  isLocal?: boolean;
};

const storage = {
  progress: "taytlo-next:playbackProgress",
  history: "taytlo-next:watchHistory",
  statuses: "taytlo-next:watchStatuses",
  comments: "taytlo-next:comments"
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

function episodeLabel(episode: AniLibriaEpisode) {
  return episode.title ? `Серия ${episode.number}: ${episode.title}` : `Серия ${episode.number}`;
}

function durationLabel(seconds: number | null) {
  return seconds ? `${Math.round(seconds / 60)} мин.` : "AniLibria";
}

function localCommentsToEntries(comments: string[], key: string): EpisodeComment[] {
  return comments.map((body, index) => ({
    id: `${key}-local-${index}`,
    authorName: "Вы",
    body,
    createdAt: "",
    isLocal: true
  }));
}

async function saveProgressRemote(anime: MiniAnime, entry: ProgressEntry) {
  const response = await fetch("/api/me/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      animeId: anime.id,
      slug: anime.slug,
      titleRu: anime.titleRu,
      episodeNumber: entry.episodeNumber,
      episodeTitle: entry.episodeTitle,
      seconds: entry.seconds
    })
  });
  if (!response.ok) throw new Error("Remote progress unavailable");
}

export function EpisodePlayer({ anime }: { anime: MiniAnime }) {
  const [data, setData] = useState<AniLibriaEpisodesResult>({ state: "empty", episodes: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AniLibriaEpisode | null>(null);
  const [status, setStatus] = useState("");
  const [comments, setComments] = useState<Record<string, EpisodeComment[]>>({});
  const [commentText, setCommentText] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedSecond = useRef(0);
  const remoteProgressBlocked = useRef(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetch(`/api/anilibria/${encodeURIComponent(anime.slug)}/episodes`)
      .then(async (response) => {
        const payload = (await response.json()) as AniLibriaEpisodesResult;
        if (!response.ok && payload.state !== "error") throw new Error("Не удалось загрузить серии");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setData(payload);
        const progress = readJson<Record<string, ProgressEntry>>(storage.progress, {})[anime.id];
        const resume = progress ? payload.episodes.find((episode) => episode.number === progress.episodeNumber) : null;
        setSelected(resume || payload.episodes[0] || null);
      })
      .catch(() => {
        if (active) setData({ state: "error", episodes: [], message: "Не удалось загрузить серии" });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    setComments({});
    return () => {
      active = false;
    };
  }, [anime.id, anime.slug]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    const key = `${anime.id}::${selected.number}`;
    const localComments = readJson<Record<string, string[]>>(storage.comments, {});

    fetch(`/api/anime/${encodeURIComponent(anime.slug)}/comments?episode=${selected.number}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("comments unavailable");
        return (await response.json()) as { comments: EpisodeComment[] };
      })
      .then((payload) => {
        if (!active) return;
        const merged = [...payload.comments, ...localCommentsToEntries(localComments[key] || [], key)];
        setComments((current) => ({ ...current, [key]: merged }));
      })
      .catch(() => {
        if (!active) return;
        setComments((current) => ({ ...current, [key]: localCommentsToEntries(localComments[key] || [], key) }));
      });

    return () => {
      active = false;
    };
  }, [anime.id, anime.slug, selected]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selected?.hlsUrl) return;

    const episode = selected;
    let destroyed = false;
    let hls: { destroy: () => void; loadSource: (url: string) => void; attachMedia: (media: HTMLMediaElement) => void } | null = null;
    const progress = readJson<Record<string, ProgressEntry>>(storage.progress, {})[anime.id];

    async function attach() {
      if (!video || !episode.hlsUrl) return;
      video.pause();
      video.removeAttribute("src");
      video.load();

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = episode.hlsUrl;
        video.load();
      } else {
        const Hls = (await import("hls.js")).default;
        if (destroyed) return;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true });
          hls.loadSource(episode.hlsUrl);
          hls.attachMedia(video);
        } else {
          setStatus("Этот браузер не поддерживает HLS. Откройте серию на AniLibria.");
        }
      }

      const restore = () => {
        if (progress?.episodeNumber === episode.number && progress.seconds > 2 && video.duration > progress.seconds) {
          video.currentTime = progress.seconds;
          setStatus(`Продолжаем с ${formatTime(progress.seconds)}`);
        } else {
          setStatus("");
        }
      };
      video.addEventListener("loadedmetadata", restore, { once: true });
    }

    attach();
    return () => {
      destroyed = true;
      hls?.destroy();
    };
  }, [anime.id, selected]);

  const commentKey = selected ? `${anime.id}::${selected.number}` : "";
  const activeComments = useMemo(() => (commentKey ? comments[commentKey] || [] : []), [commentKey, comments]);

  function rememberStatusWatching() {
    const statuses = readJson<Record<string, string>>(storage.statuses, {});
    if (!statuses[anime.id]) {
      statuses[anime.id] = "watching";
      window.localStorage.setItem(storage.statuses, JSON.stringify(statuses));
    }
  }

  function saveProgress(force = false) {
    const video = videoRef.current;
    if (!video || !selected) return;
    const seconds = Math.floor(video.currentTime || 0);
    if (!force && Math.abs(seconds - lastSavedSecond.current) < 8) return;
    lastSavedSecond.current = seconds;

    const entry: ProgressEntry = {
      episodeNumber: selected.number,
      episodeTitle: episodeLabel(selected),
      seconds,
      updatedAt: new Date().toISOString()
    };
    const progress = readJson<Record<string, ProgressEntry>>(storage.progress, {});
    progress[anime.id] = entry;
    window.localStorage.setItem(storage.progress, JSON.stringify(progress));

    const history = readJson<HistoryEntry[]>(storage.history, []).filter((item) => item.animeId !== anime.id);
    history.unshift({ ...entry, animeId: anime.id, slug: anime.slug, titleRu: anime.titleRu });
    window.localStorage.setItem(storage.history, JSON.stringify(history.slice(0, 40)));
    rememberStatusWatching();
    window.dispatchEvent(new Event("taytlo-library-change"));
    if (!remoteProgressBlocked.current) {
      saveProgressRemote(anime, entry).catch(() => {
        remoteProgressBlocked.current = true;
      });
    }
  }

  function saveLocalComment(key: string, text: string) {
    const localComments = readJson<Record<string, string[]>>(storage.comments, {});
    const nextLocal = { ...localComments, [key]: [...(localComments[key] || []), text].slice(-50) };
    window.localStorage.setItem(storage.comments, JSON.stringify(nextLocal));
  }

  async function addComment() {
    const text = commentText.trim();
    if (!commentKey || !text) return;
    setCommentText("");

    try {
      const response = await fetch(`/api/anime/${encodeURIComponent(anime.slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeNumber: selected?.number, body: text })
      });

      if (!response.ok) throw new Error("comment was not saved remotely");
      const payload = (await response.json()) as { comment: EpisodeComment };
      setComments((current) => ({
        ...current,
        [commentKey]: [...(current[commentKey] || []), payload.comment].slice(-100)
      }));
    } catch {
      saveLocalComment(commentKey, text);
      setComments((current) => ({
        ...current,
        [commentKey]: [
          ...(current[commentKey] || []),
          {
            id: `${commentKey}-local-${Date.now()}`,
            authorName: "Вы",
            body: text,
            createdAt: "",
            isLocal: true
          }
        ].slice(-100)
      }));
    }

    window.dispatchEvent(new Event("taytlo-library-change"));
  }

  return (
    <section className="episode-shell" id="episodes">
      <div className="section-title">
        <span>AniLibria API</span>
        <h2>Серии</h2>
      </div>

      <div className="episode-layout">
        <div className="episode-list-panel">
          {isLoading ? <p className="empty">Загрузка серий...</p> : null}
          {!isLoading && data.state === "error" ? <p className="empty">Не удалось загрузить серии</p> : null}
          {!isLoading && data.state === "empty" ? <p className="empty">Серии пока недоступны</p> : null}
          {!isLoading && data.episodes.length ? (
            <>
              <p className="episode-summary">
                {data.releaseName || anime.titleRu} · доступно серий: {data.episodes.length}
              </p>
              <div className="episode-list">
                {data.episodes.map((episode) => (
                  <article className={selected?.id === episode.id ? "episode-row is-active" : "episode-row"} key={episode.id}>
                    <button type="button" className="episode-number" onClick={() => setSelected(episode)}>
                      {episode.number}
                    </button>
                    <button type="button" className="episode-copy" onClick={() => setSelected(episode)}>
                      <strong>{episode.title ? `«${episode.title}»` : `Серия ${episode.number}`}</strong>
                      <span>{durationLabel(episode.duration)}</span>
                    </button>
                    {episode.hlsUrl ? (
                      <button type="button" className="watch-now" onClick={() => setSelected(episode)}>
                        Смотреть
                      </button>
                    ) : (
                      <a className="watch-now" href={episode.fallbackUrl || data.releaseUrl} target="_blank" rel="noreferrer">
                        AniLibria
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="player-panel">
          {selected?.hlsUrl ? (
            <>
              <div className="player-heading">
                <span>{episodeLabel(selected)}</span>
                {data.releaseUrl ? (
                  <a href={data.releaseUrl} target="_blank" rel="noreferrer">
                    Открыть на AniLibria
                  </a>
                ) : null}
              </div>
              <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                onPlay={() => saveProgress(true)}
                onTimeUpdate={() => saveProgress()}
                onPause={() => saveProgress(true)}
                onEnded={() => {
                  saveProgress(true);
                  setStatus("Серия завершена");
                }}
              />
              {status ? <p className="player-status">{status}</p> : null}
            </>
          ) : (
            <div className="player-placeholder">
              <strong>{data.state === "ready" ? "Выберите серию" : "Плеер появится здесь"}</strong>
              <span>Если прямой поток недоступен, открой официальный релиз на AniLibria.</span>
            </div>
          )}

          <div className="comments-panel">
            <h3>Комментарии под серией</h3>
            <div className="comment-form">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder={selected ? "Написать комментарий" : "Сначала выберите серию"}
                disabled={!selected}
              />
              <button type="button" onClick={addComment} disabled={!selected || !commentText.trim()}>
                Отправить
              </button>
            </div>
            <div className="comment-list">
              {activeComments.length ? (
                activeComments.map((comment) => (
                  <p key={comment.id}>
                    <strong>{comment.authorName}</strong>
                    <span>{comment.isLocal ? "Локально" : comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("ru") : ""}</span>
                    {comment.body}
                  </p>
                ))
              ) : (
                <span>{selected ? "Комментариев пока нет" : "Комментарии появятся после выбора серии"}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

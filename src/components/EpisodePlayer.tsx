"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedList from "@/components/AnimatedList";
import { getEpisodeNavigation } from "@/lib/episode-navigation";
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

  function selectEpisode(episode: AniLibriaEpisode) {
    if (episode.hlsUrl) {
      setSelected(episode);
      setStatus("");
      return;
    }

    const fallbackUrl = episode.fallbackUrl || data.releaseUrl;
    if (fallbackUrl) {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setSelected(episode);
  }

  const episodeNavigation = getEpisodeNavigation(data.episodes, selected?.id);
  const selectedEpisodeIndex = episodeNavigation.index;
  const previousEpisode = episodeNavigation.previous;
  const nextEpisode = episodeNavigation.next;
  const alternativeSources = data.alternativeSources || [];

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
          {!isLoading && !data.episodes.length && alternativeSources.length ? (
            <div className="alternative-sources">
              <span>Другие озвучки и источники</span>
              <strong>Проверить легальные варианты</strong>
              <p>Если AniLibria не дала серии, можно открыть поиск по площадкам, где иногда есть дубляж, субтитры или официальные загрузки.</p>
              <div className="alternative-source-list">
                {alternativeSources.map((source) => (
                  <a href={source.url} target="_blank" rel="noreferrer" className="alternative-source-card" key={source.id}>
                    <span>{source.title}</span>
                    <strong>{source.voice}</strong>
                    <small>{source.note}</small>
                    <em>{source.label}</em>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {!isLoading && data.episodes.length ? (
            <>
              <p className="episode-summary">
                {data.releaseName || anime.titleRu} · доступно серий: {data.episodes.length}
              </p>
              <AnimatedList
                items={data.episodes}
                getKey={(episode) => episode.id}
                selectedIndex={selectedEpisodeIndex}
                onItemSelect={(episode) => selectEpisode(episode)}
                className="episode-list"
                itemClassName={(episode, _index, isSelected) => `episode-row${isSelected ? " is-active" : ""}${episode.hlsUrl ? "" : " is-external"}`}
                ariaLabel={`Серии ${data.releaseName || anime.titleRu}`}
                renderItem={(episode) => (
                  <>
                    <span className="episode-number">{episode.number}</span>
                    <span className="episode-copy">
                      <strong>{episode.title ? `«${episode.title}»` : `Серия ${episode.number}`}</strong>
                      <span>{durationLabel(episode.duration)}</span>
                    </span>
                    <span className="watch-now">{episode.hlsUrl ? "Смотреть" : "AniLibria"}</span>
                  </>
                )}
              />
            </>
          ) : null}
        </div>

        <div className="player-panel">
          {selected?.hlsUrl ? (
            <>
              <div className="player-heading">
                <span>{episodeLabel(selected)}</span>
                <button type="button" onClick={() => previousEpisode && selectEpisode(previousEpisode)} disabled={!previousEpisode}>
                  Предыдущая
                </button>
                <button type="button" onClick={() => nextEpisode && selectEpisode(nextEpisode)} disabled={!nextEpisode}>
                  Следующая
                </button>
                {data.releaseUrl ? (
                  <a href={data.releaseUrl} target="_blank" rel="noreferrer">
                    Открыть на AniLibria
                  </a>
                ) : null}
              </div>
              <div className="mobile-episode-switcher" aria-label="Переключение серий">
                <button type="button" onClick={() => previousEpisode && selectEpisode(previousEpisode)} disabled={!previousEpisode}>
                  Назад
                </button>
                <select
                  value={String(selected.id)}
                  onChange={(event) => {
                    const episode = data.episodes.find((item) => String(item.id) === event.target.value);
                    if (episode) selectEpisode(episode);
                  }}
                  aria-label="Выбрать серию"
                >
                  {data.episodes.map((episode) => (
                    <option key={episode.id} value={String(episode.id)}>
                      {episode.title ? `${episode.number}. ${episode.title}` : `Серия ${episode.number}`}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => nextEpisode && selectEpisode(nextEpisode)} disabled={!nextEpisode}>
                  Вперёд
                </button>
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
                  setStatus(nextEpisode ? `Серия завершена. Дальше — серия ${nextEpisode.number}` : "Серия завершена");
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

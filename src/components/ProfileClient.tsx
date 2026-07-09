"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SafeImage } from "./SafeImage";
import { isLogoutResponseSuccessful, logoutErrorMessage } from "@/lib/auth-client";
import type { Anime } from "@/lib/types";

type ProfileAnime = Pick<Anime, "id" | "slug" | "titleRu" | "image" | "shikimori">;

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type Library = {
  favorites: string[];
  watchStatuses: Record<string, string>;
  progress: Record<string, { episodeTitle?: string; seconds?: number; updatedAt?: string }>;
  history: Array<{ animeId: string; slug: string; titleRu: string; episodeTitle?: string; seconds?: number; updatedAt?: string }>;
  comments: Record<string, string[]>;
};

const statusLabels: Record<string, string> = {
  watching: "Смотрю",
  completed: "Посмотрел",
  dropped: "Брошено",
  planned: "Планирую"
};

function formatTime(seconds?: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function emptyLibrary(): Library {
  return {
    favorites: [],
    watchStatuses: {},
    progress: {},
    history: [],
    comments: {}
  };
}

export function ProfileClient({ catalog }: { catalog: ProfileAnime[] }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [library, setLibrary] = useState<Library>(emptyLibrary());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

  const byId = useMemo(() => new Map(catalog.map((anime) => [anime.id, anime])), [catalog]);
  const favorites = library.favorites.map((id) => byId.get(id)).filter(Boolean) as ProfileAnime[];
  const watchItems = Object.entries(library.watchStatuses)
    .map(([id, status]) => ({ anime: byId.get(id), status }))
    .filter((item) => item.anime) as Array<{ anime: ProfileAnime; status: string }>;

  async function refresh() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        setLibrary(emptyLibrary());
        return;
      }
      const payload = await response.json();
      setUser(payload.user);
      setLibrary(payload.library || emptyLibrary());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("taytlo-library-change", onChange);
    return () => window.removeEventListener("taytlo-library-change", onChange);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    setMessage("");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        password: form.get("password")
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Не удалось выполнить действие");
      return;
    }
    window.dispatchEvent(new Event("taytlo-auth-change"));
    await refresh();
  }

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin"
      });
      const payload = await response.json().catch(() => ({}));
      const nextMessage = logoutErrorMessage(
        isLogoutResponseSuccessful(response.ok, payload.ok),
        typeof payload.error === "string" ? payload.error : undefined
      );
      if (nextMessage) {
        setMessage(nextMessage);
        return;
      }
      setUser(null);
      setLibrary(emptyLibrary());
      window.dispatchEvent(new Event("taytlo-auth-change"));
      window.location.assign("/profile");
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function syncNow() {
    window.dispatchEvent(new Event("taytlo-library-change"));
    setMessage("Синхронизация запущена");
    setTimeout(() => refresh(), 900);
  }

  if (isLoading) {
    return <p className="empty">Загрузка профиля...</p>;
  }

  if (!user) {
    return (
      <section className="profile-panel">
        <div>
          <p className="eyebrow">Taytlo account</p>
          <h1>{mode === "register" ? "Создать аккаунт" : "Войти"}</h1>
          <p>Аккаунт сохранит избранное, списки, комментарии и место, где ты остановился.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" ? <input name="name" placeholder="Имя" /> : null}
          <input name="email" type="email" placeholder="Почта" required />
          <input name="password" type="password" placeholder="Пароль" minLength={6} required />
          <button type="submit">{mode === "register" ? "Зарегистрироваться" : "Войти"}</button>
          <button type="button" className="ghost-button" onClick={() => setMode(mode === "register" ? "login" : "register")}>
            {mode === "register" ? "Уже есть аккаунт" : "Создать аккаунт"}
          </button>
          {message ? <span className="form-message">{message}</span> : null}
        </form>
      </section>
    );
  }

  return (
    <section className="profile-panel">
      <div className="profile-head">
        <div>
          <p className="eyebrow">Профиль</p>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="profile-actions">
          <button type="button" onClick={syncNow}>
            Синхронизировать
          </button>
          <button type="button" className="ghost-button" onClick={logout} disabled={isLoggingOut} aria-live="polite">
            <span hidden={!isLoggingOut}>Выходим...</span>
            <span hidden={isLoggingOut}>
              Выйти
            </span>
          </button>
        </div>
      </div>

      <div className="profile-stats">
        <span>
          <strong>{library.favorites.length}</strong>
          избранных
        </span>
        <span>
          <strong>{watchItems.length}</strong>
          в списках
        </span>
        <span>
          <strong>{Object.keys(library.progress).length}</strong>
          прогрессов
        </span>
        <span>
          <strong>{Object.values(library.comments).flat().length}</strong>
          комментариев
        </span>
      </div>

      <div className="profile-columns">
        <div>
          <h2>Продолжить</h2>
          <div className="profile-list">
            {library.history.slice(0, 6).map((item) => (
              <Link href={`/anime/${item.slug}#episodes`} className="profile-item" key={`${item.animeId}-${item.updatedAt}`}>
                <strong>{item.titleRu}</strong>
                <span>
                  {item.episodeTitle || "Серия"} · {formatTime(item.seconds)}
                </span>
              </Link>
            ))}
            {!library.history.length ? <p className="empty">История пока пустая</p> : null}
          </div>
        </div>
        <div>
          <h2>Списки</h2>
          <div className="profile-list">
            {watchItems.slice(0, 8).map(({ anime, status }) => (
              <Link href={`/anime/${anime.slug}`} className="profile-item" key={anime.id}>
                <strong>{anime.titleRu}</strong>
                <span>{statusLabels[status] || status}</span>
              </Link>
            ))}
            {!watchItems.length ? <p className="empty">Списки пока пустые</p> : null}
          </div>
        </div>
      </div>

      <div>
        <h2>Избранное</h2>
        <div className="profile-favorites">
          {favorites.slice(0, 10).map((anime) => (
            <Link href={`/anime/${anime.slug}`} className="profile-favorite" key={anime.id}>
              <SafeImage src={anime.image} alt={anime.titleRu} />
              <strong>{anime.titleRu}</strong>
            </Link>
          ))}
          {!favorites.length ? <p className="empty">Избранных пока нет</p> : null}
        </div>
      </div>
      {message ? <p className="form-message">{message}</p> : null}
    </section>
  );
}

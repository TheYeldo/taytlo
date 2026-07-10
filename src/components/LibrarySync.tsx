"use client";

import { useEffect, useRef } from "react";
import { isLogoutMarkerActive, logoutMarkerKey } from "@/lib/auth-client";

type Library = {
  favorites: string[];
  watchStatuses: Record<string, string>;
  progress: Record<string, unknown>;
  history: unknown[];
  comments: Record<string, string[]>;
  updatedAt?: string;
};

const keys = {
  favorites: "taytlo-next:favorites",
  watchStatuses: "taytlo-next:watchStatuses",
  progress: "taytlo-next:playbackProgress",
  history: "taytlo-next:watchHistory",
  comments: "taytlo-next:comments"
};

function readJson<T>(key: string, fallback: T): T {
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

function readLocalLibrary(): Library {
  return {
    favorites: readJson<string[]>(keys.favorites, []),
    watchStatuses: readJson<Record<string, string>>(keys.watchStatuses, {}),
    progress: readJson<Record<string, unknown>>(keys.progress, {}),
    history: readJson<unknown[]>(keys.history, []),
    comments: readJson<Record<string, string[]>>(keys.comments, {})
  };
}

function writeLocalLibrary(library: Library) {
  writeJson(keys.favorites, library.favorites || []);
  writeJson(keys.watchStatuses, library.watchStatuses || {});
  writeJson(keys.progress, library.progress || {});
  writeJson(keys.history, library.history || []);
  writeJson(keys.comments, library.comments || {});
}

function mergeLibrary(server: Library | null, local: Library): Library {
  const serverLibrary = server || {
    favorites: [],
    watchStatuses: {},
    progress: {},
    history: [],
    comments: {}
  };

  const historyByKey = new Map<string, unknown>();
  [...(serverLibrary.history || []), ...(local.history || [])].forEach((entry) => {
    const item = entry as { animeId?: string; updatedAt?: string; episodeTitle?: string };
    const key = `${item.animeId || "item"}::${item.updatedAt || item.episodeTitle || Math.random()}`;
    historyByKey.set(key, entry);
  });

  return {
    favorites: [...new Set([...(serverLibrary.favorites || []), ...(local.favorites || [])])],
    watchStatuses: { ...(serverLibrary.watchStatuses || {}), ...(local.watchStatuses || {}) },
    progress: { ...(serverLibrary.progress || {}), ...(local.progress || {}) },
    history: [...historyByKey.values()].slice(-80).reverse(),
    comments: { ...(serverLibrary.comments || {}), ...(local.comments || {}) },
    updatedAt: new Date().toISOString()
  };
}

async function saveRemote(library: Library) {
  await fetch("/api/me/library", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ library })
  });
}

export function LibrarySync() {
  const loggedInRef = useRef(false);
  const syncingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (isLogoutMarkerActive(window.localStorage.getItem(logoutMarkerKey))) {
          loggedInRef.current = false;
          syncingRef.current = false;
          return;
        }
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          loggedInRef.current = false;
          return;
        }
        const payload = await response.json();
        loggedInRef.current = Boolean(payload.user);
        if (!payload.user) return;

        syncingRef.current = true;
        const merged = mergeLibrary(payload.library, readLocalLibrary());
        writeLocalLibrary(merged);
        window.dispatchEvent(new Event("taytlo-library-change"));
        await saveRemote(merged);
        syncingRef.current = false;
      } catch {
        loggedInRef.current = false;
        syncingRef.current = false;
      }
    }

    function scheduleSave() {
      if (!loggedInRef.current || syncingRef.current) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        saveRemote(readLocalLibrary()).catch(() => undefined);
      }, 700);
    }

    function markLoggedOut() {
      loggedInRef.current = false;
      syncingRef.current = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    bootstrap();
    window.addEventListener("taytlo-library-change", scheduleSave);
    window.addEventListener("taytlo-auth-change", bootstrap);
    window.addEventListener("taytlo-logout", markLoggedOut);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("taytlo-library-change", scheduleSave);
      window.removeEventListener("taytlo-auth-change", bootstrap);
      window.removeEventListener("taytlo-logout", markLoggedOut);
    };
  }, []);

  return null;
}

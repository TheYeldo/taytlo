import { NextResponse } from "next/server";
import { getCurrentLibrary, saveCurrentLibrary } from "@/lib/account-store";
import type { HistoryEntry, ProgressEntry } from "@/lib/account-types";

function numberFrom(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: Request) {
  const result = await getCurrentLibrary();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const animeId = new URL(request.url).searchParams.get("animeId");
  if (animeId) {
    return NextResponse.json({
      progress: result.library.progress[animeId] || null,
      history: result.library.history.find((item) => item.animeId === animeId) || null
    });
  }

  return NextResponse.json({
    progress: result.library.progress,
    history: result.library.history
  });
}

export async function PUT(request: Request) {
  const current = await getCurrentLibrary();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const animeId = String(body.animeId || "").trim();
  const slug = String(body.slug || "").trim();
  const titleRu = String(body.titleRu || "").trim();
  const episodeNumber = Math.max(1, Math.floor(numberFrom(body.episodeNumber)));

  if (!animeId || !slug || !titleRu || !episodeNumber) {
    return NextResponse.json({ error: "Bad progress payload" }, { status: 400 });
  }

  const entry: ProgressEntry = {
    episodeNumber,
    episodeTitle: String(body.episodeTitle || `Серия ${episodeNumber}`).trim(),
    seconds: Math.max(0, Math.floor(numberFrom(body.seconds))),
    updatedAt: new Date().toISOString()
  };

  const historyEntry: HistoryEntry = {
    ...entry,
    animeId,
    slug,
    titleRu
  };

  const previous = current.library;
  const watchStatuses = { ...previous.watchStatuses };
  if (!watchStatuses[animeId]) watchStatuses[animeId] = "watching";

  const result = await saveCurrentLibrary({
    progress: {
      ...previous.progress,
      [animeId]: entry
    },
    history: [historyEntry, ...previous.history.filter((item) => item.animeId !== animeId)].slice(0, 80),
    watchStatuses
  });

  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    progress: result.library.progress[animeId],
    history: result.library.history.find((item) => item.animeId === animeId) || historyEntry,
    library: result.library
  });
}

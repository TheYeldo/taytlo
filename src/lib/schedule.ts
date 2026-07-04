import scheduleData from "../../data/schedule-cache.json";

export type ScheduleItem = {
  id?: string;
  malId?: number;
  animeSlug?: string;
  title?: string;
  titleRu?: string;
  episode?: number;
  episodeNumber?: number;
  airAt?: string;
  nextEpisodeAt?: string;
  duration?: number | null;
  timezone?: string;
  source?: string;
  url?: string;
  image?: string;
};

type ScheduleResult = {
  items: ScheduleItem[];
  source: "shikimori" | "cache";
  error?: string;
};

type ShikimoriCalendarEntry = {
  next_episode?: number;
  next_episode_at?: string;
  duration?: number | null;
  anime?: {
    id?: number;
    name?: string;
    russian?: string;
    url?: string;
    kind?: string;
    status?: string;
    image?: {
      original?: string;
      preview?: string;
      x96?: string;
      x48?: string;
    };
  };
};

type ShikimoriCalendarImage = NonNullable<NonNullable<ShikimoriCalendarEntry["anime"]>["image"]>;

const SHIKIMORI_CALENDAR_URL = "https://shikimori.one/api/calendar";
const SHIKIMORI_BASE_URL = "https://shikimori.one";
const MOSCOW_TIMEZONE = "Europe/Moscow";

function asItems(): ScheduleItem[] {
  const raw = scheduleData as { items?: ScheduleItem[]; entries?: ScheduleItem[] } | ScheduleItem[];
  return Array.isArray(raw) ? raw : raw.items ?? raw.entries ?? [];
}

function getItemTime(item: ScheduleItem) {
  return Date.parse(item.airAt || item.nextEpisodeAt || "");
}

function sortByDate(left: ScheduleItem, right: ScheduleItem) {
  return getItemTime(left) - getItemTime(right);
}

export function getUpcomingSchedule(limit = 12) {
  const now = Date.now();
  return asItems()
    .filter((item) => {
      const time = getItemTime(item);
      return Number.isFinite(time) && time >= now;
    })
    .sort(sortByDate)
    .slice(0, limit);
}

function absoluteShikimoriUrl(url?: string) {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SHIKIMORI_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function shikimoriImageUrl(image?: ShikimoriCalendarImage) {
  const raw = image?.original || image?.preview || image?.x96 || image?.x48 || "";
  if (!raw || raw.includes("/assets/globals/missing_")) return undefined;
  return absoluteShikimoriUrl(raw);
}

function toScheduleItem(entry: ShikimoriCalendarEntry): ScheduleItem | null {
  const anime = entry.anime;
  const malId = Number(anime?.id || 0);
  const airAt = entry.next_episode_at || "";
  const time = Date.parse(airAt);
  if (!malId || !Number.isFinite(time)) return null;

  return {
    id: `mal-${malId}`,
    malId,
    title: anime?.name || anime?.russian || "Anime",
    titleRu: anime?.russian || anime?.name || "Аниме",
    episode: entry.next_episode,
    episodeNumber: entry.next_episode,
    airAt,
    nextEpisodeAt: airAt,
    duration: entry.duration ?? null,
    timezone: MOSCOW_TIMEZONE,
    source: "shikimori",
    url: absoluteShikimoriUrl(anime?.url),
    image: shikimoriImageUrl(anime?.image)
  };
}

async function fetchShikimoriCalendar() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(SHIKIMORI_CALENDAR_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Taytlo/1.0"
      },
      next: { revalidate: 900 },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Shikimori calendar returned ${response.status}`);
    }

    return (await response.json()) as ShikimoriCalendarEntry[];
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLiveUpcomingSchedule(limit = 12): Promise<ScheduleResult> {
  const now = Date.now();
  try {
    const calendar = await fetchShikimoriCalendar();
    const upcoming = calendar
      .filter((entry) => {
        const time = Date.parse(entry.next_episode_at || "");
        return Number.isFinite(time) && time >= now;
      })
      .filter((entry) => entry.anime?.status === "ongoing" || Number(entry.next_episode || 0) > 1)
      .map(toScheduleItem)
      .filter((item): item is ScheduleItem => Boolean(item))
      .sort(sortByDate)
      .slice(0, limit);

    if (upcoming.length) {
      return { items: upcoming, source: "shikimori" };
    }
  } catch (error) {
    return {
      items: getUpcomingSchedule(limit),
      source: "cache",
      error: error instanceof Error ? error.message : "Unable to load Shikimori calendar"
    };
  }

  return { items: getUpcomingSchedule(limit), source: "cache" };
}

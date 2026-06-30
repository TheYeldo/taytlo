import scheduleData from "../../data/schedule-cache.json";

export type ScheduleItem = {
  id?: string;
  animeSlug?: string;
  title?: string;
  titleRu?: string;
  episode?: number;
  episodeNumber?: number;
  airAt?: string;
  nextEpisodeAt?: string;
  source?: string;
  url?: string;
};

function asItems(): ScheduleItem[] {
  const raw = scheduleData as { items?: ScheduleItem[]; entries?: ScheduleItem[] } | ScheduleItem[];
  return Array.isArray(raw) ? raw : raw.items ?? raw.entries ?? [];
}

export function getUpcomingSchedule(limit = 12) {
  const now = Date.now();
  return asItems()
    .filter((item) => {
      const time = Date.parse(item.airAt || item.nextEpisodeAt || "");
      return Number.isFinite(time) && time >= now;
    })
    .sort((left, right) => Date.parse(left.airAt || left.nextEpisodeAt || "") - Date.parse(right.airAt || right.nextEpisodeAt || ""))
    .slice(0, limit);
}

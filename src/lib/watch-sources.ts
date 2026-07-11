import type { Anime, LegalWatchSource } from "./types";

type SourceTemplate = {
  id: string;
  title: string;
  label: string;
  voice: string;
  note: string;
  buildUrl: (query: string) => string;
};

const sourceTemplates: SourceTemplate[] = [
  {
    id: "kinopoisk",
    title: "Кинопоиск",
    label: "Проверить",
    voice: "дубляж и субтитры, если тайтл лицензирован",
    note: "Поиск по легальной библиотеке и партнёрским подпискам.",
    buildUrl: (query) => `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(query)}`
  },
  {
    id: "okko",
    title: "Okko",
    label: "Найти",
    voice: "русская озвучка или субтитры, если доступны",
    note: "Подходит для фильмов и популярных сериалов с официальной лицензией.",
    buildUrl: (query) => `https://okko.tv/search/${encodeURIComponent(query)}`
  },
  {
    id: "wink",
    title: "Wink",
    label: "Проверить",
    voice: "дубляж, многоголосая озвучка или субтитры",
    note: "Показываем как легальный fallback, когда AniLibria не дала поток.",
    buildUrl: (query) => `https://wink.ru/search?query=${encodeURIComponent(query)}`
  },
  {
    id: "crunchyroll",
    title: "Crunchyroll",
    label: "Открыть поиск",
    voice: "официальные субтитры/озвучка по региону",
    note: "Международная официальная площадка, доступность зависит от региона.",
    buildUrl: (query) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: "youtube-official",
    title: "YouTube",
    label: "Искать официально",
    voice: "официальные каналы, трейлеры и легальные эпизоды",
    note: "Открывается поиск только по официальным/легальным загрузкам.",
    buildUrl: (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} аниме официально смотреть`)}`
  }
];

function bestSearchTitle(anime: Anime) {
  return anime.titleRu || anime.title || anime.altTitles[0] || anime.slug;
}

export function getLegalWatchSources(anime: Anime): LegalWatchSource[] {
  const query = bestSearchTitle(anime);
  return sourceTemplates.map((source) => ({
    id: source.id,
    title: source.title,
    label: source.label,
    voice: source.voice,
    note: source.note,
    url: source.buildUrl(query)
  }));
}

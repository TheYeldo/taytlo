"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Anime } from "@/lib/types";
import { SafeImage } from "./SafeImage";

type RouletteAnime = Pick<
  Anime,
  | "id"
  | "slug"
  | "titleRu"
  | "type"
  | "year"
  | "episodes"
  | "franchise"
  | "genres"
  | "image"
  | "synopsis"
  | "aniLibriaReleaseId"
  | "popularityBase"
  | "requestBase"
  | "shikimori"
>;

type MoodKey = "episodes" | "action" | "romance" | "short" | "rating";

type MoodOption = {
  key: MoodKey;
  label: string;
  note: string;
  hint: string;
  matches: (anime: RouletteAnime) => boolean;
};

const actionGenres = ["Экшен", "Боевые искусства", "Спорт", "Супер сила", "Ниндзя"];
const heavyGenres = ["Экшен", "Сёнен", "Сёнэн", "Супер сила", "Боевые искусства", "Ниндзя", "Военное", "Ужасы", "Психология", "Психологическое"];

const moods: MoodOption[] = [
  {
    key: "episodes",
    label: "Сразу смотреть",
    note: "Серии уже есть",
    hint: "Тайтлы с сериями AniLibria и нормальной длиной для старта.",
    matches: (anime) => Boolean(anime.aniLibriaReleaseId && isEntryFriendly(anime, 64))
  },
  {
    key: "action",
    label: "Драйв",
    note: "Экшен до 36 серий",
    hint: "Темп, бои и азарт без входа на сотни серий.",
    matches: (anime) => hasGenre(anime, actionGenres) && isEntryFriendly(anime, 36)
  },
  {
    key: "romance",
    label: "Лёгкий вечер",
    note: "Спокойные тайтлы",
    hint: "Для спокойного просмотра без тяжёлого входа.",
    matches: (anime) => isCalmPick(anime) && isEntryFriendly(anime, 26)
  },
  {
    key: "short",
    label: "На пару дней",
    note: "До 13 серий",
    hint: "Короткие сезоны, которые проще начать прямо сейчас.",
    matches: (anime) => Boolean(anime.episodes && anime.episodes <= 13)
  },
  {
    key: "rating",
    label: "Надёжный выбор",
    note: "Высокий SH",
    hint: "Высокие оценки Shikimori без слишком длинного входа.",
    matches: (anime) => Boolean(anime.shikimori?.score && anime.shikimori.score >= 8.25 && isEntryFriendly(anime, 64))
  }
];

function hasGenre(anime: RouletteAnime, genres: string[]) {
  const wanted = new Set(genres);
  return anime.genres.some((genre) => wanted.has(genre));
}

function isEntryFriendly(anime: RouletteAnime, maxEpisodes: number) {
  return Boolean(anime.episodes && anime.episodes > 0 && anime.episodes <= maxEpisodes);
}

function isCalmPick(anime: RouletteAnime) {
  const hasRomance = hasGenre(anime, ["Романтика"]);
  const hasSlice = hasGenre(anime, ["Повседневность"]) || (hasGenre(anime, ["Школа"]) && hasGenre(anime, ["Комедия"]));
  return (hasRomance || hasSlice) && !hasGenre(anime, heavyGenres);
}

function scoreForMood(anime: RouletteAnime, mood: MoodKey) {
  const score = anime.shikimori?.score || 0;
  const episodes = anime.episodes || 80;
  const lengthPenalty = Math.max(0, episodes - 24) * 80;
  const availabilityBonus = anime.aniLibriaReleaseId ? 900 : 0;
  const base = score * 4200 + anime.popularityBase * 0.18 + anime.requestBase * 0.55 + availabilityBonus - lengthPenalty;

  if (mood === "rating") {
    return score * 9000 + anime.popularityBase * 0.08 + anime.requestBase * 0.25 - Math.max(0, episodes - 36) * 120;
  }

  if (mood === "short") {
    return base + (episodes <= 1 ? 900 : 0) + (14 - episodes) * 140;
  }

  if (mood === "action") {
    return base + (episodes <= 26 ? 1200 : 0) + (anime.aniLibriaReleaseId ? 600 : 0);
  }

  if (mood === "romance") {
    return base + (hasGenre(anime, ["Романтика"]) ? 1400 : 0) + (episodes <= 13 ? 500 : 0);
  }

  return base + (episodes <= 28 ? 700 : 0);
}

function cleanSynopsis(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 190 ? `${text.slice(0, 187)}...` : text;
}

export function AnimeRoulette({ catalog }: { catalog: RouletteAnime[] }) {
  const [selectedMood, setSelectedMood] = useState<MoodKey>("episodes");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeMood = moods.find((mood) => mood.key === selectedMood) || moods[0];
  const candidates = useMemo(() => {
    const matches = catalog.filter(activeMood.matches);
    const source = matches.length ? matches : catalog.filter((anime) => isEntryFriendly(anime, 64));
    return source.sort((left, right) => scoreForMood(right, activeMood.key) - scoreForMood(left, activeMood.key));
  }, [activeMood, catalog]);
  const pickPool = candidates.slice(0, Math.min(candidates.length, 18));
  const selected = pickPool[selectedIndex % Math.max(pickPool.length, 1)];

  if (!selected) return null;

  function selectMood(key: MoodKey) {
    setSelectedMood(key);
    setSelectedIndex(0);
  }

  function pickAnother() {
    if (pickPool.length <= 1) {
      setSelectedIndex(0);
      return;
    }

    setSelectedIndex((current) => {
      const currentIndex = current % pickPool.length;
      const next = Math.floor(Math.random() * pickPool.length);
      return next === currentIndex ? (next + 1) % pickPool.length : next;
    });
  }

  return (
    <section className="content-section roulette-section" id="roulette">
      <div className="roulette-panel">
        <div className="roulette-copy">
          <div className="section-title">
            <span>Подбор</span>
            <h2>Не знаешь, что включить?</h2>
          </div>
          <p className="section-note">
            Выбери настроение, а Taytlo подкинет тайтл из подходящей подборки. Длинные франшизы не лезут туда, где хочется быстро включить и смотреть.
          </p>

          <div className="roulette-moods" role="group" aria-label="Настроения для подбора аниме">
            {moods.map((mood) => (
              <button
                key={mood.key}
                type="button"
                className={mood.key === selectedMood ? "is-active" : ""}
                onClick={() => selectMood(mood.key)}
              >
                <strong>{mood.label}</strong>
                <span>{mood.note}</span>
              </button>
            ))}
          </div>

          <div className="roulette-context">
            <strong>{activeMood.note}</strong>
            <span>{pickPool.length} вариантов в быстрой подборке</span>
          </div>

          <div className="roulette-actions">
            <button type="button" onClick={pickAnother}>
              Подобрать ещё
            </button>
            <Link href={`/anime/${selected.slug}${selected.aniLibriaReleaseId ? "#episodes" : ""}`}>Открыть тайтл</Link>
          </div>
        </div>

        <article className="roulette-result">
          <SafeImage src={selected.image} alt={selected.titleRu} loading="lazy" />
          <div className="roulette-result-copy">
            <span>{activeMood.hint}</span>
            <h3>{selected.titleRu}</h3>
            <p>{cleanSynopsis(selected.synopsis) || "Описание скоро появится."}</p>
            <div className="roulette-meta">
              <small>{selected.type}</small>
              <small>{selected.year || "год неизвестен"}</small>
              <small>{selected.episodes ? `${selected.episodes} серий` : "серии уточняются"}</small>
              {selected.shikimori?.score ? <small>SH {selected.shikimori.score.toFixed(2)}</small> : null}
              {selected.aniLibriaReleaseId ? <small>AniLibria</small> : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

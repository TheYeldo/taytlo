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

const moods: MoodOption[] = [
  {
    key: "episodes",
    label: "Сразу смотреть",
    note: "Есть серии",
    hint: "Тайтлы с привязанными сериями AniLibria.",
    matches: (anime) => Boolean(anime.aniLibriaReleaseId)
  },
  {
    key: "action",
    label: "Драйв",
    note: "Экшен и приключения",
    hint: "Когда хочется темпа, боёв и большой истории.",
    matches: (anime) => hasGenre(anime, ["Экшен", "Сёнен", "Сёнэн", "Приключения", "Боевые искусства"])
  },
  {
    key: "romance",
    label: "Лёгкий вечер",
    note: "Романтика",
    hint: "Для спокойного просмотра без тяжёлого входа.",
    matches: (anime) => hasGenre(anime, ["Романтика", "Комедия", "Школа", "Повседневность"])
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
    hint: "Тайтлы с сильной оценкой Shikimori.",
    matches: (anime) => Boolean(anime.shikimori?.score && anime.shikimori.score >= 8)
  }
];

function hasGenre(anime: RouletteAnime, genres: string[]) {
  const wanted = new Set(genres);
  return anime.genres.some((genre) => wanted.has(genre));
}

function rank(anime: RouletteAnime) {
  return (anime.shikimori?.score || 0) * 1200 + anime.popularityBase + anime.requestBase + (anime.aniLibriaReleaseId ? 900 : 0);
}

function cleanSynopsis(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 190 ? `${text.slice(0, 187)}...` : text;
}

export function AnimeRoulette({ catalog }: { catalog: RouletteAnime[] }) {
  const [selectedMood, setSelectedMood] = useState<MoodKey>("episodes");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const ranked = useMemo(() => [...catalog].sort((left, right) => rank(right) - rank(left)), [catalog]);
  const activeMood = moods.find((mood) => mood.key === selectedMood) || moods[0];
  const candidates = useMemo(() => {
    const matches = ranked.filter(activeMood.matches);
    return matches.length ? matches : ranked;
  }, [activeMood, ranked]);
  const selected = candidates[selectedIndex % Math.max(candidates.length, 1)];

  if (!selected) return null;

  function selectMood(key: MoodKey) {
    setSelectedMood(key);
    setSelectedIndex(0);
  }

  function pickAnother() {
    if (candidates.length <= 1) {
      setSelectedIndex(0);
      return;
    }

    setSelectedIndex((current) => {
      const currentIndex = current % candidates.length;
      const next = Math.floor(Math.random() * candidates.length);
      return next === currentIndex ? (next + 1) % candidates.length : next;
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
            Выбери настроение, а Taytlo подкинет тайтл из каталога. Можно сразу открыть страницу аниме или крутить дальше, пока не зацепит.
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

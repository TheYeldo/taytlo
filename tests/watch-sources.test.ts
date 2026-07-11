import assert from "node:assert/strict";
import test from "node:test";
import { getLegalWatchSources } from "../src/lib/watch-sources.ts";
import type { Anime } from "../src/lib/types.ts";

const anime: Anime = {
  id: "test-anime",
  slug: "test-anime",
  malId: null,
  aniLibriaReleaseId: null,
  source: "test",
  title: "Test Anime",
  titleRu: "Тестовое аниме",
  type: "TV",
  year: 2026,
  episodes: null,
  franchise: "Тест",
  genres: [],
  image: "",
  synopsis: "",
  altTitles: [],
  trailer: "",
  status: "",
  popularityBase: 0,
  requestBase: 0,
  shikimori: null,
  characters: []
};

test("getLegalWatchSources returns safe search links for licensed platforms", () => {
  const sources = getLegalWatchSources(anime);

  assert.ok(sources.length >= 4);
  assert.ok(sources.every((source) => source.url.startsWith("https://")));
  assert.ok(sources.some((source) => source.id === "kinopoisk"));
  assert.ok(sources.some((source) => source.id === "youtube-official"));
  assert.ok(sources.every((source) => source.voice.length > 0));
});

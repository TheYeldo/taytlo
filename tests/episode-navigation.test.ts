import assert from "node:assert/strict";
import test from "node:test";
import { getEpisodeNavigation } from "../src/lib/episode-navigation.ts";

const episodes = [
  { id: "e1", number: 1 },
  { id: "e2", number: 2 },
  { id: "e3", number: 3 }
];

test("getEpisodeNavigation returns previous and next episodes around selected episode", () => {
  assert.deepEqual(getEpisodeNavigation(episodes, "e2"), {
    index: 1,
    previous: episodes[0],
    next: episodes[2]
  });
});

test("getEpisodeNavigation handles first and missing selected episodes", () => {
  assert.deepEqual(getEpisodeNavigation(episodes, "e1"), {
    index: 0,
    previous: null,
    next: episodes[1]
  });

  assert.deepEqual(getEpisodeNavigation(episodes, null), {
    index: -1,
    previous: null,
    next: null
  });
});

test("getEpisodeNavigation supports numeric episode ids", () => {
  const numericEpisodes = [
    { id: 1, number: 1 },
    { id: 2, number: 2 }
  ];

  assert.deepEqual(getEpisodeNavigation(numericEpisodes, 2), {
    index: 1,
    previous: numericEpisodes[0],
    next: null
  });
});

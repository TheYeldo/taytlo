import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const catalogPath = path.join(projectRoot, "data", "catalog.json");
const anilibriaBase = "https://anilibria.top";
const USER_AGENT = "Taytlo/1.0 anilibria linker";

function parseArgs() {
  const args = new Map();
  for (const item of process.argv.slice(2)) {
    const [key, value = ""] = item.replace(/^--/, "").split("=");
    args.set(key, value);
  }

  return {
    limit: Math.max(1, Number(args.get("limit") || 260)),
    delay: Math.max(150, Number(args.get("delay") || 260)),
    minScore: Math.max(1, Number(args.get("min-score") || 14)),
    force: args.has("force")
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT
    }
  });

  if (response.status === 429 && attempt < 4) {
    await sleep(1200 * attempt);
    return fetchJson(url, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("ru")
    .normalize("NFKC")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeType(value) {
  const normalized = String(value || "").toUpperCase().replace(/[^A-Z]+/g, "_");
  if (normalized.includes("MOVIE")) return "MOVIE";
  if (normalized.includes("OVA")) return "OVA";
  if (normalized.includes("ONA")) return "ONA";
  if (normalized.includes("SPECIAL")) return "SPECIAL";
  if (normalized.includes("TV")) return "TV";
  return normalized;
}

function queryTerms(anime) {
  return [anime.titleRu, anime.title, ...(Array.isArray(anime.altTitles) ? anime.altTitles : [])]
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((item) => normalize(item) === normalize(value)) === index)
    .slice(0, 4);
}

function releaseNames(release) {
  return [release.name?.main, release.name?.english, release.name?.alternative].map(normalize).filter(Boolean);
}

function matchRelease(anime, release) {
  const animeNames = queryTerms(anime).map(normalize).filter(Boolean);
  const names = releaseNames(release);
  let score = 0;
  let hasStrongTitle = false;
  let hasCloseYear = false;
  let hasCloseEpisodes = false;
  let hasTypeMatch = false;

  for (const animeName of animeNames) {
    for (const releaseName of names) {
      if (animeName === releaseName) {
        score = Math.max(score, 14);
        hasStrongTitle = true;
      } else if (Math.min(animeName.length, releaseName.length) >= 5 && (animeName.includes(releaseName) || releaseName.includes(animeName))) {
        score = Math.max(score, 6);
      }
    }
  }

  const yearDiff = Math.abs(Number(anime.year || 0) - Number(release.year || 0));
  if (anime.year && release.year && yearDiff === 0) {
    score += 5;
    hasCloseYear = true;
  } else if (anime.year && release.year && yearDiff === 1) {
    score += 3;
    hasCloseYear = true;
  } else if (anime.year && release.year && yearDiff <= 2) {
    score += 1;
    hasCloseYear = true;
  } else if (anime.year && release.year && yearDiff >= 3) {
    score -= yearDiff >= 8 ? 10 : 8;
  }

  const animeType = normalizeType(anime.type);
  const releaseType = normalizeType(release.type?.value);
  if (animeType && releaseType) {
    if (animeType === releaseType) {
      score += 3;
      hasTypeMatch = true;
    } else if ((animeType === "TV" && releaseType === "MOVIE") || (animeType === "MOVIE" && releaseType === "TV")) {
      score -= 5;
    }
  }

  const animeEpisodes = Number(anime.episodes || 0);
  const releaseEpisodes = Number(release.episodes_total || 0);
  if (animeEpisodes && releaseEpisodes) {
    const episodeDiff = Math.abs(animeEpisodes - releaseEpisodes);
    if (episodeDiff === 0) {
      score += 5;
      hasCloseEpisodes = true;
    } else if (episodeDiff <= 1) {
      score += 3;
      hasCloseEpisodes = true;
    } else if (episodeDiff <= 3) {
      score += 1;
    } else if (episodeDiff > Math.max(4, animeEpisodes * 0.3)) {
      score -= 5;
    }
  }

  const isReliable = hasStrongTitle && (hasCloseYear || hasCloseEpisodes || (!anime.year && hasTypeMatch));
  return {
    release,
    score: isReliable ? score : Math.min(score, 8),
    isReliable
  };
}

async function searchReleases(query) {
  const payload = await fetchJson(`${anilibriaBase}/api/v1/app/search/releases?query=${encodeURIComponent(query)}`);
  return Array.isArray(payload) ? payload : payload.data || [];
}

async function resolveRelease(anime, delay, minScore) {
  const byId = new Map();
  const confidentScore = Math.max(18, minScore + 4);

  for (const term of queryTerms(anime)) {
    const releases = await searchReleases(term);
    for (const release of releases) {
      if (release?.id) byId.set(release.id, release);
    }
    const currentBest = [...byId.values()]
      .map((release) => matchRelease(anime, release))
      .sort((left, right) => right.score - left.score)[0];
    if (currentBest?.score >= confidentScore) break;
    await sleep(delay);
  }

  const ranked = [...byId.values()]
    .map((release) => matchRelease(anime, release))
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  return best?.isReliable && best.score >= minScore ? best : null;
}

async function main() {
  const options = parseArgs();
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const targets = catalog.filter((anime) => options.force || !anime.aniLibriaReleaseId).slice(0, options.limit);
  const linked = [];
  const skipped = [];
  const errors = [];

  for (const anime of targets) {
    try {
      const match = await resolveRelease(anime, options.delay, options.minScore);
      if (match) {
        anime.aniLibriaReleaseId = match.release.id;
        linked.push({
          title: anime.titleRu,
          releaseId: match.release.id,
          releaseTitle: match.release.name?.main || match.release.name?.english,
          score: match.score,
          year: match.release.year,
          episodes: match.release.episodes_total
        });
      } else {
        skipped.push(anime.titleRu);
      }
    } catch (error) {
      errors.push(`${anime.titleRu}: ${error.message}`);
    }
    await sleep(options.delay);
  }

  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Checked: ${targets.length}`);
  console.log(`Min score: ${options.minScore}`);
  console.log(`Linked: ${linked.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(linked.map((item) => `${item.releaseId}: ${item.title} -> ${item.releaseTitle} (${item.score})`).join("\n"));
  if (errors.length) {
    console.warn(errors.slice(0, 20).join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

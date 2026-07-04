import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const catalogPath = path.join(projectRoot, "data", "catalog.json");
const SHIKIMORI_ORIGIN = "https://shikimori.one";
const USER_AGENT = "Taytlo/1.0 catalog import";

const KIND_LABELS = {
  tv: "TV",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
  music: "Music",
  tv_special: "TV Special"
};

function parseArgs() {
  const args = new Map();
  for (const item of process.argv.slice(2)) {
    const [key, value = ""] = item.replace(/^--/, "").split("=");
    args.set(key, value);
  }

  return {
    limit: Math.max(1, Number(args.get("limit") || 120)),
    pages: Math.max(1, Number(args.get("pages") || 10)),
    delay: Math.max(150, Number(args.get("delay") || 280))
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json"
    }
  });

  if (response.status === 429 && attempt < 4) {
    await sleep(1200 * attempt);
    return fetchJson(url, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
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

function cleanDescription(value) {
  const text = String(value || "")
    .replace(/\[(?:anime|character|manga)=[^\]]+\]([^\[]+)\[\/(?:anime|character|manga)\]/giu, "$1")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text || "Описание пока уточняется, но тайтл уже добавлен в каталог Taytlo с данными Shikimori.";
}

function shikimoriUrl(value) {
  if (!value) return "";
  return value.startsWith("http") ? value : `${SHIKIMORI_ORIGIN}${value}`;
}

function fullImage(image) {
  const candidate = image?.original || image?.preview || "";
  if (!candidate || candidate.includes("/assets/globals/missing_")) return "";
  return shikimoriUrl(candidate);
}

function slugFromAnime(anime) {
  const fromUrl = String(anime.url || "")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/^z?\d+-/, "");

  return (
    fromUrl ||
    String(anime.name || anime.russian || anime.id)
      .toLocaleLowerCase("en")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function uniqueSlug(baseSlug, usedSlugs) {
  let slug = baseSlug || "anime";
  let index = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

function franchiseFrom(titleRu, title) {
  const titleValue = String(titleRu || title || "").trim();
  const cleaned = titleValue
    .replace(/\s+\d+\s*$/u, "")
    .replace(/\s+\d+\s*(?:сезон|season)\s*$/iu, "")
    .replace(/\s+\d(?:-й|-я|-е)\s+сезон\s*$/iu, "")
    .replace(/[:：].+$/u, "")
    .trim();

  return cleaned.length >= 3 ? cleaned : titleValue;
}

function votesFrom(detail) {
  const stats = Array.isArray(detail?.rates_scores_stats) ? detail.rates_scores_stats : [];
  return stats.reduce((sum, item) => sum + Number(item?.value || 0), 0);
}

function yearFrom(anime) {
  const value = anime.aired_on || anime.released_on;
  const year = Number(String(value || "").slice(0, 4));
  return Number.isFinite(year) && year > 1900 ? year : null;
}

function makeEntry(anime, detail, index) {
  const score = Number(detail.score || anime.score || 0);
  const votes = votesFrom(detail);
  const titleRu = detail.russian || anime.russian || detail.name || anime.name;
  const title = detail.name || anime.name || titleRu;
  const image = fullImage(detail.image || anime.image);

  return {
    id: `mal-${detail.id || anime.id}`,
    slug: slugFromAnime(detail.url ? detail : anime),
    malId: Number(detail.id || anime.id),
    aniLibriaReleaseId: null,
    source: "shikimori",
    title,
    titleRu,
    type: KIND_LABELS[detail.kind || anime.kind] || "TV",
    year: yearFrom(detail) || yearFrom(anime),
    episodes: Number(detail.episodes || anime.episodes || 0) || null,
    franchise: franchiseFrom(titleRu, title),
    genres: Array.isArray(detail.genres) ? detail.genres.map((genre) => genre.russian || genre.name).filter(Boolean) : [],
    image,
    synopsis: cleanDescription(detail.description),
    altTitles: [titleRu, title, ...(Array.isArray(detail.english) ? detail.english : []), ...(Array.isArray(detail.synonyms) ? detail.synonyms : [])]
      .filter(Boolean)
      .filter((value, valueIndex, values) => values.findIndex((item) => normalize(item) === normalize(value)) === valueIndex),
    trailer: "",
    status: detail.status || anime.status || "unknown",
    popularityBase: Math.max(1200, Math.round(Math.min(180000, votes * 0.42 + (score || 6) * 1600 + (120 - index) * 55))),
    requestBase: Math.max(300, Math.round(Math.min(18000, votes * 0.035 + (score || 6) * 520))),
    shikimori: score
      ? {
          id: Number(detail.id || anime.id),
          title,
          titleRu,
          score,
          votes: votes || undefined,
          url: shikimoriUrl(detail.url || anime.url),
          confidence: 99,
          matchedBy: "shikimori-popular-id"
        }
      : null,
    characters: []
  };
}

function collectKeys(anime) {
  return [anime.titleRu, anime.title, anime.franchise, ...(Array.isArray(anime.altTitles) ? anime.altTitles : [])]
    .map(normalize)
    .filter(Boolean);
}

async function main() {
  const options = parseArgs();
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const usedSlugs = new Set(catalog.map((anime) => anime.slug).filter(Boolean));
  const seenIds = new Set(catalog.map((anime) => Number(anime.malId || 0)).filter(Boolean));
  const seenTitles = new Set(catalog.flatMap(collectKeys));
  const candidates = [];

  for (let page = 1; page <= options.pages; page += 1) {
    const url = `${SHIKIMORI_ORIGIN}/api/animes?order=popularity&limit=50&page=${page}`;
    const items = await fetchJson(url);
    if (!Array.isArray(items) || !items.length) break;
    candidates.push(...items);
    await sleep(options.delay);
  }

  const added = [];
  const skipped = { duplicate: 0, poster: 0, detail: 0 };

  for (const candidate of candidates) {
    if (added.length >= options.limit) break;
    const id = Number(candidate.id || 0);
    if (!id || seenIds.has(id)) {
      skipped.duplicate += 1;
      continue;
    }

    const listTitleKeys = [candidate.russian, candidate.name].map(normalize).filter(Boolean);
    if (listTitleKeys.some((key) => seenTitles.has(key))) {
      skipped.duplicate += 1;
      continue;
    }

    let detail;
    try {
      detail = await fetchJson(`${SHIKIMORI_ORIGIN}/api/animes/${id}`);
    } catch (error) {
      skipped.detail += 1;
      console.warn(`Skipping ${id}: ${error.message}`);
      await sleep(options.delay);
      continue;
    }

    const detailTitleKeys = [detail.russian, detail.name, ...(Array.isArray(detail.synonyms) ? detail.synonyms : [])]
      .map(normalize)
      .filter(Boolean);
    if (detailTitleKeys.some((key) => seenTitles.has(key))) {
      skipped.duplicate += 1;
      await sleep(options.delay);
      continue;
    }

    if (!fullImage(detail.image || candidate.image)) {
      skipped.poster += 1;
      await sleep(options.delay);
      continue;
    }

    const entry = makeEntry(candidate, detail, added.length);
    entry.slug = uniqueSlug(entry.slug, usedSlugs);
    catalog.push(entry);
    added.push(entry);
    seenIds.add(entry.malId);
    for (const key of collectKeys(entry)) seenTitles.add(key);
    await sleep(options.delay);
  }

  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  console.log(`Catalog size: ${catalog.length}`);
  console.log(`Added: ${added.length}`);
  console.log(`Skipped duplicates: ${skipped.duplicate}`);
  console.log(`Skipped missing posters: ${skipped.poster}`);
  console.log(`Skipped detail errors: ${skipped.detail}`);
  console.log(added.map((anime) => `${anime.malId}: ${anime.titleRu}`).join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const staticRoot = path.resolve(projectRoot, "..", "anime-site");
const scriptPath = path.join(staticRoot, "script.js");
const extraCatalogPath = path.join(staticRoot, "seo.extra-catalog.json");
const ratingsPath = path.join(staticRoot, "shikimori-ratings.json");
const schedulePath = path.join(staticRoot, "schedule-cache.json");
const shikimoriMapPath = path.join(staticRoot, "shikimori-map.json");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`Cannot read ${filePath}: ${error.message}`);
    return fallback;
  }
}

const cp1251Decoder = new TextDecoder("windows-1251");
const cp1251ByteByChar = new Map(
  Array.from({ length: 256 }, (_, byte) => [cp1251Decoder.decode(Uint8Array.of(byte)), byte])
);

function looksMojibaked(value) {
  return /(?:Рџ|Рђ|РЇ|Рё|Р°|Рµ|СЏ|СЋ|СЊ|С‹|С‰|С‡|вЂ)/.test(String(value || ""));
}

function repairText(value) {
  const text = String(value ?? "");
  if (!looksMojibaked(text)) return text;

  const bytes = [];
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 128) {
      bytes.push(code);
      continue;
    }
    const byte = cp1251ByteByChar.get(char);
    if (byte === undefined) return text;
    bytes.push(byte);
  }

  return Buffer.from(bytes).toString("utf8");
}

function repairObject(value) {
  if (typeof value === "string") return repairText(value);
  if (Array.isArray(value)) return value.map(repairObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairObject(item)]));
  }
  return value;
}

function transliterate(value) {
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya"
  };

  return String(value || "")
    .toLocaleLowerCase("ru")
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
}

function slugify(value) {
  return (
    transliterate(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "anime"
  );
}

function normalizeKey(value) {
  return String(value || "")
    .toLocaleLowerCase("ru")
    .normalize("NFKC")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImage(value) {
  const raw = String(value || "").trim();
  if (!raw) return "/assets/fallback-poster.svg";
  if (/^https?:\/\/127\.0\.0\.1:\d+\/assets\//i.test(raw)) {
    return raw.replace(/^https?:\/\/127\.0\.0\.1:\d+/i, "");
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return `/${raw.replace(/^\.\//, "").replace(/^\/+/, "")}`;
}

function readStaticCatalog() {
  const source = fs.readFileSync(scriptPath, "utf8");
  const start = source.indexOf("const seedCatalog =");
  const end = source.indexOf("const storageKeys =");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Cannot find static catalog block in script.js");
  }

  const snippet = source
    .slice(start, end)
    .replace("const seedCatalog =", "globalThis.seedCatalog =")
    .replace("const narutoRelatedCatalog =", "globalThis.narutoRelatedCatalog =");
  const context = {};
  vm.createContext(context);
  vm.runInContext(snippet, context, { filename: "taytlo-static-catalog.js" });

  const byKey = new Map();
  for (const anime of [...(context.seedCatalog || []), ...(context.narutoRelatedCatalog || [])]) {
    if (!anime?.id) continue;
    const titleKey = normalizeKey([anime.titleRu, anime.title, anime.malId].filter(Boolean).join(" "));
    byKey.set(anime.id, { ...anime, titleKey });
  }

  const extraCatalog = readJson(extraCatalogPath, []);
  for (const anime of Array.isArray(extraCatalog) ? extraCatalog : []) {
    if (!anime?.id) continue;
    byKey.set(anime.id, { ...(byKey.get(anime.id) || {}), ...anime });
  }

  return [...byKey.values()];
}

const ratingsCache = repairObject(readJson(ratingsPath, { items: {} }));
const shikimoriMap = repairObject(readJson(shikimoriMapPath, { anime: {}, anilibria: {} }));
const seenSlugs = new Map();

const catalog = readStaticCatalog().map((rawAnime) => {
  const anime = repairObject(rawAnime);
  const rating = ratingsCache.items?.[anime.id];
  const title = anime.titleRu || anime.title || anime.id;
  const baseSlug = slugify(title);
  const slugCount = seenSlugs.get(baseSlug) || 0;
  seenSlugs.set(baseSlug, slugCount + 1);
  const slug = slugCount ? `${baseSlug}-${slugCount + 1}` : baseSlug;

  return {
    id: anime.id,
    slug,
    malId: Number(anime.malId || rating?.id || 0) || null,
    aniLibriaReleaseId: Number(anime.aniLibriaReleaseId || 0) || null,
    source: anime.source || "static",
    title: anime.title || title,
    titleRu: title,
    type: anime.type || "TV",
    year: Number(anime.year || 0) || null,
    episodes: Number(anime.episodes || anime.episodesAired || 0) || null,
    franchise: anime.franchise || title,
    genres: Array.isArray(anime.genres) ? anime.genres.filter(Boolean) : [],
    image: normalizeImage(anime.image),
    synopsis: anime.synopsis || "",
    altTitles: Array.isArray(anime.altTitles) ? anime.altTitles.filter(Boolean) : [],
    trailer: anime.trailer || "",
    status: anime.status || "unknown",
    popularityBase: Number(anime.popularityBase || 0) || 0,
    requestBase: Number(anime.requestBase || 0) || 0,
    shikimori: rating?.status === "ready"
      ? {
          id: rating.id,
          title: rating.title,
          titleRu: rating.titleRu,
          score: rating.score,
          votes: rating.votes,
          url: rating.url,
          confidence: rating.confidence,
          matchedBy: rating.matchedBy
        }
      : null,
    characters: Array.isArray(anime.characters)
      ? anime.characters.slice(0, 12).map((character) => ({
          id: character.id,
          name: character.name,
          role: character.role,
          image: normalizeImage(character.image),
          tags: Array.isArray(character.tags) ? character.tags : []
        }))
      : []
  };
});

fs.mkdirSync(path.join(projectRoot, "data"), { recursive: true });
fs.writeFileSync(path.join(projectRoot, "data", "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(projectRoot, "data", "shikimori-ratings.json"), `${JSON.stringify(ratingsCache, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(projectRoot, "data", "shikimori-map.json"), `${JSON.stringify(shikimoriMap, null, 2)}\n`, "utf8");

const schedule = repairObject(readJson(schedulePath, { items: [] }));
fs.writeFileSync(path.join(projectRoot, "data", "schedule-cache.json"), `${JSON.stringify(schedule, null, 2)}\n`, "utf8");

console.log(`Imported ${catalog.length} anime into data/catalog.json`);

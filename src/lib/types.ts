export type ShikimoriRating = {
  id: number;
  title: string;
  titleRu: string;
  score: number;
  votes?: number;
  url?: string;
  confidence?: number;
  matchedBy?: string;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  image?: string;
  tags: string[];
};

export type Anime = {
  id: string;
  slug: string;
  malId: number | null;
  aniLibriaReleaseId: number | null;
  source: string;
  title: string;
  titleRu: string;
  type: string;
  year: number | null;
  episodes: number | null;
  franchise: string;
  genres: string[];
  image: string;
  synopsis: string;
  altTitles: string[];
  trailer: string;
  status: string;
  popularityBase: number;
  requestBase: number;
  shikimori: ShikimoriRating | null;
  characters: Character[];
};

export type AniLibriaEpisode = {
  id: number | string;
  number: number;
  title: string;
  hlsUrl: string;
  fallbackUrl: string;
  duration: number | null;
};

export type AniLibriaEpisodesResult = {
  state: "ready" | "empty" | "error";
  releaseId?: number;
  releaseName?: string;
  releaseUrl?: string;
  firstEpisode?: number;
  lastEpisode?: number;
  expectedEpisodes?: number;
  isOngoing?: boolean;
  episodes: AniLibriaEpisode[];
  message?: string;
};

export type CatalogQuery = {
  search?: string;
  genre?: string;
  franchise?: string;
  availability?: "episodes";
  sort?: "popular" | "rating" | "new" | "title";
  page?: number;
  limit?: number;
};

export type CatalogResult = {
  items: Anime[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

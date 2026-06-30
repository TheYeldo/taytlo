export const sessionCookieName = "taytlo_session";
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

export type ProgressEntry = {
  episodeNumber: number;
  episodeTitle: string;
  seconds: number;
  updatedAt: string;
};

export type HistoryEntry = ProgressEntry & {
  animeId: string;
  slug: string;
  titleRu: string;
};

export type UserLibrary = {
  favorites: string[];
  watchStatuses: Record<string, string>;
  progress: Record<string, ProgressEntry>;
  history: HistoryEntry[];
  comments: Record<string, string[]>;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthResult = {
  user: PublicUser;
  token: string;
};

export type LibraryResult = {
  user: PublicUser;
  library: UserLibrary;
};

export type AccountStore = {
  registerUser(input: { email: string; name: string; password: string }): Promise<AuthResult>;
  loginUser(input: { email: string; password: string }): Promise<AuthResult>;
  getCurrentUser(): Promise<PublicUser | null>;
  logoutCurrentSession(): Promise<void>;
  getCurrentLibrary(): Promise<LibraryResult | null>;
  saveCurrentLibrary(input: Partial<UserLibrary>): Promise<LibraryResult | null>;
};

export function nowIso() {
  return new Date().toISOString();
}

export function emptyLibrary(): UserLibrary {
  return {
    favorites: [],
    watchStatuses: {},
    progress: {},
    history: [],
    comments: {},
    updatedAt: nowIso()
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("ru");
}

export function uniqueStrings(items: unknown) {
  return Array.isArray(items) ? [...new Set(items.map(String).filter(Boolean))] : [];
}

export function cleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, never>;
}

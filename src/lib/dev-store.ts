import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cleanRecord, emptyLibrary, normalizeEmail, nowIso, sessionMaxAgeSeconds, uniqueStrings } from "./account-types";
import type { ProgressEntry, PublicUser, UserLibrary } from "./account-types";
import { getSessionToken } from "./session-cookie";

type StoredUser = PublicUser & {
  passwordSalt: string;
  passwordHash: string;
};

type StoredSession = {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

type DevDb = {
  users: StoredUser[];
  sessions: StoredSession[];
  libraries: Record<string, UserLibrary>;
};

const dbPath = path.join(process.cwd(), "data", "dev-db.json");

async function readDb(): Promise<DevDb> {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<DevDb>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      libraries: parsed.libraries && typeof parsed.libraries === "object" ? parsed.libraries : {}
    };
  } catch {
    return { users: [], sessions: [], libraries: {} };
  }
}

async function writeDb(db: DevDb) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString("hex")
  };
}

function verifyPassword(password: string, salt: string, hash: string) {
  const candidate = Buffer.from(hashPassword(password, salt).hash, "hex");
  const stored = Buffer.from(hash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

function publicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
  };
}

function cleanExpiredSessions(db: DevDb) {
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => Date.parse(session.expiresAt) > now);
}

export async function registerUser(input: { email: string; name: string; password: string }) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim() || email.split("@")[0] || "Taytlo user";
  if (!email.includes("@")) throw new Error("Укажите корректную почту");
  if (input.password.length < 6) throw new Error("Пароль должен быть от 6 символов");

  const db = await readDb();
  cleanExpiredSessions(db);
  if (db.users.some((user) => user.email === email)) throw new Error("Пользователь уже существует");

  const password = hashPassword(input.password);
  const user: StoredUser = {
    id: randomBytes(12).toString("hex"),
    email,
    name,
    passwordSalt: password.salt,
    passwordHash: password.hash,
    createdAt: nowIso()
  };

  db.users.push(user);
  db.libraries[user.id] = emptyLibrary();
  const token = createSessionInDb(db, user.id);
  await writeDb(db);
  return { user: publicUser(user), token };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const db = await readDb();
  cleanExpiredSessions(db);
  const user = db.users.find((item) => item.email === email);
  if (!user || !verifyPassword(input.password, user.passwordSalt, user.passwordHash)) {
    throw new Error("Неверная почта или пароль");
  }
  const token = createSessionInDb(db, user.id);
  await writeDb(db);
  return { user: publicUser(user), token };
}

function createSessionInDb(db: DevDb, userId: string) {
  const token = randomBytes(32).toString("hex");
  db.sessions.push({
    token,
    userId,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString()
  });
  return token;
}

export async function getCurrentUser() {
  const token = getSessionToken();
  if (!token) return null;
  const db = await readDb();
  cleanExpiredSessions(db);
  const session = db.sessions.find((item) => item.token === token);
  const user = session ? db.users.find((item) => item.id === session.userId) : null;
  if (!session || !user) {
    await writeDb(db);
    return null;
  }
  await writeDb(db);
  return publicUser(user);
}

export async function logoutCurrentSession() {
  const token = getSessionToken();
  if (!token) return;
  const db = await readDb();
  const current = db.sessions.find((session) => session.token === token);
  if (!current) return;
  db.sessions = db.sessions.filter((session) => session.userId !== current.userId);
  await writeDb(db);
}

export async function getCurrentLibrary() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = await readDb();
  const library = db.libraries[user.id] || emptyLibrary();
  db.libraries[user.id] = library;
  await writeDb(db);
  return { user, library };
}

export async function saveCurrentLibrary(input: Partial<UserLibrary>) {
  const user = await getCurrentUser();
  if (!user) return null;

  const db = await readDb();
  const previous = db.libraries[user.id] || emptyLibrary();
  const next: UserLibrary = {
    favorites: uniqueStrings(input.favorites ?? previous.favorites),
    watchStatuses: cleanRecord(input.watchStatuses ?? previous.watchStatuses) as Record<string, string>,
    progress: cleanRecord(input.progress ?? previous.progress) as Record<string, ProgressEntry>,
    history: Array.isArray(input.history) ? input.history.slice(0, 80) : previous.history,
    comments: cleanRecord(input.comments ?? previous.comments) as Record<string, string[]>,
    updatedAt: nowIso()
  };

  db.libraries[user.id] = next;
  await writeDb(db);
  return { user, library: next };
}

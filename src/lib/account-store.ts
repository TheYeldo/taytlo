import "server-only";
import type { AccountStore } from "./account-types";
import * as devStore from "./dev-store";
import { resolveStoreMode } from "./store-mode";

const storeMode = resolveStoreMode({
  nodeEnv: process.env.NODE_ENV,
  requestedStore: process.env.TAYTLO_STORE,
  databaseUrl: process.env.DATABASE_URL
});

export class AccountStoreUnavailableError extends Error {
  constructor() {
    super("Аккаунты временно недоступны: база данных сайта ещё не подключена");
    this.name = "AccountStoreUnavailableError";
  }
}

async function loadStore(): Promise<AccountStore> {
  if (storeMode === "dev-json") return devStore;
  if (storeMode === "prisma") return import("./prisma-store");
  throw new AccountStoreUnavailableError();
}

export async function registerUser(input: { email: string; name: string; password: string }) {
  return (await loadStore()).registerUser(input);
}

export async function loginUser(input: { email: string; password: string }) {
  return (await loadStore()).loginUser(input);
}

export async function getCurrentUser() {
  return (await loadStore()).getCurrentUser();
}

export async function logoutCurrentSession() {
  return (await loadStore()).logoutCurrentSession();
}

export async function getCurrentLibrary() {
  return (await loadStore()).getCurrentLibrary();
}

export async function saveCurrentLibrary(input: Parameters<AccountStore["saveCurrentLibrary"]>[0]) {
  return (await loadStore()).saveCurrentLibrary(input);
}

export function activeStoreName() {
  return storeMode;
}

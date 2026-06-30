import "server-only";
import type { AccountStore } from "./account-types";
import * as devStore from "./dev-store";

const prismaEnabled = process.env.TAYTLO_STORE === "prisma" || Boolean(process.env.DATABASE_URL && process.env.NODE_ENV === "production");

async function loadStore(): Promise<AccountStore> {
  if (!prismaEnabled) return devStore;
  return import("./prisma-store");
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
  return prismaEnabled ? "prisma" : "dev-json";
}

export type StoreMode = "dev-json" | "prisma" | "unconfigured";

type StoreEnvironment = {
  nodeEnv?: string;
  requestedStore?: string;
  databaseUrl?: string;
};

export function resolveStoreMode(environment: StoreEnvironment): StoreMode {
  const hasDatabase = Boolean(environment.databaseUrl?.trim());

  if (environment.nodeEnv === "production") {
    return hasDatabase ? "prisma" : "unconfigured";
  }

  if (environment.requestedStore === "prisma") {
    return hasDatabase ? "prisma" : "unconfigured";
  }

  return "dev-json";
}

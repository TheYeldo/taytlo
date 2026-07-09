import assert from "node:assert/strict";
import test from "node:test";
import { resolveStoreMode } from "../src/lib/store-mode.ts";

test("production without DATABASE_URL never uses the writable dev JSON store", () => {
  assert.equal(
    resolveStoreMode({
      nodeEnv: "production",
      requestedStore: undefined,
      databaseUrl: undefined
    }),
    "unconfigured"
  );
});

test("production uses Prisma when DATABASE_URL is configured", () => {
  assert.equal(
    resolveStoreMode({
      nodeEnv: "production",
      requestedStore: undefined,
      databaseUrl: "postgresql://example"
    }),
    "prisma"
  );
});

test("local development keeps the JSON store available", () => {
  assert.equal(
    resolveStoreMode({
      nodeEnv: "development",
      requestedStore: undefined,
      databaseUrl: undefined
    }),
    "dev-json"
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { logoutErrorMessage } from "../src/lib/auth-client.ts";

test("logoutErrorMessage returns empty text for successful logout", () => {
  assert.equal(logoutErrorMessage(true, undefined), "");
});

test("logoutErrorMessage prefers API error text when logout fails", () => {
  assert.equal(logoutErrorMessage(false, "Session store failed"), "Session store failed");
});

test("logoutErrorMessage has a readable fallback when logout fails without payload", () => {
  assert.equal(logoutErrorMessage(false, undefined), "Не удалось выйти из аккаунта. Попробуйте обновить страницу.");
});

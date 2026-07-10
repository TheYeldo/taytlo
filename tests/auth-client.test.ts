import assert from "node:assert/strict";
import test from "node:test";
import { isLogoutMarkerActive, isLogoutResponseSuccessful, logoutErrorMessage } from "../src/lib/auth-client.ts";

test("logoutErrorMessage returns empty text for successful logout", () => {
  assert.equal(logoutErrorMessage(true, undefined), "");
});

test("logoutErrorMessage prefers API error text when logout fails", () => {
  assert.equal(logoutErrorMessage(false, "Session store failed"), "Session store failed");
});

test("logoutErrorMessage has a readable fallback when logout fails without payload", () => {
  assert.equal(logoutErrorMessage(false, undefined), "Не удалось выйти из аккаунта. Попробуйте обновить страницу.");
});

test("isLogoutResponseSuccessful treats API ok:false as failed logout", () => {
  assert.equal(isLogoutResponseSuccessful(true, false), false);
});

test("isLogoutResponseSuccessful accepts successful HTTP response without explicit API flag", () => {
  assert.equal(isLogoutResponseSuccessful(true, undefined), true);
});

test("isLogoutMarkerActive keeps a recent logout marker active", () => {
  assert.equal(isLogoutMarkerActive("1000", 2000), true);
});

test("isLogoutMarkerActive ignores missing or invalid logout marker", () => {
  assert.equal(isLogoutMarkerActive(null, 2000), false);
  assert.equal(isLogoutMarkerActive("nope", 2000), false);
});

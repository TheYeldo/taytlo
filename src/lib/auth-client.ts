export const logoutMarkerKey = "taytlo-next:logout-requested-at";

const logoutMarkerTtlMs = 24 * 60 * 60 * 1000;

export function isLogoutMarkerActive(value: string | null, now = Date.now()) {
  if (!value) return false;
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 && now - timestamp < logoutMarkerTtlMs;
}

export function isLogoutResponseSuccessful(responseOk: boolean, apiOk?: unknown) {
  return responseOk && apiOk !== false;
}

export function logoutErrorMessage(ok: boolean, apiError?: string) {
  if (ok) return "";
  return apiError || "Не удалось выйти из аккаунта. Попробуйте обновить страницу.";
}

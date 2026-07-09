export function isLogoutResponseSuccessful(responseOk: boolean, apiOk?: unknown) {
  return responseOk && apiOk !== false;
}

export function logoutErrorMessage(ok: boolean, apiError?: string) {
  if (ok) return "";
  return apiError || "Не удалось выйти из аккаунта. Попробуйте обновить страницу.";
}

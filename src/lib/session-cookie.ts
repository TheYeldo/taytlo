import "server-only";
import { cookies } from "next/headers";
import { sessionCookieName, sessionMaxAgeSeconds } from "./account-types";

export function getSessionToken() {
  return cookies().get(sessionCookieName)?.value || "";
}

export function setSessionCookie(token: string) {
  cookies().set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  });
}

export function clearSessionCookie() {
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  } as const;
  const store = cookies();

  store.set(sessionCookieName, "", baseOptions);
  store.set(sessionCookieName, "", { ...baseOptions, domain: "taytlo.com" });
  store.set(sessionCookieName, "", { ...baseOptions, domain: ".taytlo.com" });
}

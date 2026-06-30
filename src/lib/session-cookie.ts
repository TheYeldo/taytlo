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
  cookies().set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

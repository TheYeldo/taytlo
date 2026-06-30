import type { NextRequest } from "next/server";

export function isAdminTokenValid(token: string | null | undefined) {
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(expected && token && token === expected);
}

export function requireAdminRequest(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const token = request.headers.get("x-admin-token") || bearer || request.nextUrl.searchParams.get("token");
  return isAdminTokenValid(token);
}

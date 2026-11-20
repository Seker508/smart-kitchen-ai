import type { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "./jwt";

export async function setSessionCookie(res: NextResponse, user: { id: string; tokenVersion: number }) {
  res.cookies.set(SESSION_COOKIE, await signSession({ sub: user.id, v: user.tokenVersion }), sessionCookieOptions());
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
}

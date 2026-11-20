import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "./jwt";
import { userFromToken, type SessionUser } from "./user";

export type { SessionUser };

/** Sunucu bileşenleri için (istek başına önbellekli) */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return userFromToken(store.get(SESSION_COOKIE)?.value);
});

export async function requirePageUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/giris");
  return u;
}

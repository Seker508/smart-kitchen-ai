import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifySession } from "./jwt";

export type SessionUser = { id: string; firstName: string; lastName: string; email: string; createdAt: Date };

/** Oturumdaki kullanıcıyı veritabanından doğrular (şifre değişince eski çerezler geçersizdir). */
export async function userFromToken(token: string | undefined | null): Promise<SessionUser | null> {
  const payload = await verifySession(token);
  if (!payload) return null;
  const u = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
    columns: { id: true, firstName: true, lastName: true, email: true, createdAt: true, tokenVersion: true },
  });
  if (!u || u.tokenVersion !== payload.v) return null;
  const { tokenVersion: _v, ...rest } = u;
  return rest;
}


import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, shoppingLists, userPreferences, users } from "@/db/schema";
import { ApiError } from "../api";
import { fakeVerify, hashPassword, verifyPassword } from "../auth/password";
import { deleteUserUploads } from "../upload";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function registerUser(input: { firstName: string; lastName: string; email: string; password: string }) {
  const exists = await db.query.users.findFirst({ where: eq(users.email, input.email), columns: { id: true } });
  if (exists) throw new ApiError(409, "Bu e-posta adresiyle kayıtlı bir hesap zaten var.", "EMAIL_TAKEN", { fields: { email: "Bu e-posta zaten kayıtlı." } });
  const passwordHash = await hashPassword(input.password);
  return db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({
      firstName: input.firstName, lastName: input.lastName, email: input.email, passwordHash,
    }).returning({ id: users.id, tokenVersion: users.tokenVersion, firstName: users.firstName });
    await tx.insert(userPreferences).values({ userId: u.id });
    await tx.insert(shoppingLists).values({ userId: u.id });
    return u;
  });
}

export async function authenticate(email: string, password: string) {
  const u = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!u) {
    await fakeVerify();
    return null;
  }
  return (await verifyPassword(password, u.passwordHash)) ? u : null;
}

/** Şifre sıfırlama jetonu üretir. Ham jeton yalnızca bir kez döner; veritabanında özeti (hash) saklanır. */
export async function createResetToken(email: string): Promise<string | null> {
  const u = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } });
  if (!u) return null;
  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResetTokens).values({
    userId: u.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60_000),
  });
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const row = await db.query.passwordResetTokens.findFirst({
    where: and(eq(passwordResetTokens.tokenHash, sha256(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())),
  });
  if (!row) throw new ApiError(400, "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeniden talep edin.", "BAD_TOKEN");
  const passwordHash = await hashPassword(newPassword);
  await db.transaction(async (tx) => {
    const u = await tx.query.users.findFirst({ where: eq(users.id, row.userId), columns: { tokenVersion: true } });
    await tx.update(users).set({ passwordHash, tokenVersion: (u?.tokenVersion ?? 0) + 1 }).where(eq(users.id, row.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.userId, row.userId));
  });
}

export async function changePassword(userId: string, current: string, next: string) {
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u || !(await verifyPassword(current, u.passwordHash))) {
    throw new ApiError(400, "Mevcut şifre hatalı.", "BAD_PASSWORD", { fields: { currentPassword: "Mevcut şifre hatalı." } });
  }
  const [updated] = await db.update(users)
    .set({ passwordHash: await hashPassword(next), tokenVersion: u.tokenVersion + 1 })
    .where(eq(users.id, userId)).returning({ id: users.id, tokenVersion: users.tokenVersion });
  return updated;
}

export async function updateProfile(userId: string, p: { firstName: string; lastName: string; email: string }) {
  const clash = await db.query.users.findFirst({ where: and(eq(users.email, p.email), ne(users.id, userId)), columns: { id: true } });
  if (clash) throw new ApiError(409, "Bu e-posta başka bir hesapta kullanılıyor.", "EMAIL_TAKEN", { fields: { email: "Bu e-posta kullanımda." } });
  const [u] = await db.update(users).set(p).where(eq(users.id, userId))
    .returning({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email });
  return u;
}

export async function updatePreferences(userId: string, p: Omit<typeof userPreferences.$inferInsert, "userId" | "id">) {
  await db.insert(userPreferences).values({ userId, ...p })
    .onConflictDoUpdate({ target: userPreferences.userId, set: p });
}

export async function deleteAccount(userId: string, password: string) {
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u || !(await verifyPassword(password, u.passwordHash))) throw new ApiError(400, "Şifre hatalı.", "BAD_PASSWORD");
  await db.delete(users).where(eq(users.id, userId));
  await deleteUserUploads(userId);
}

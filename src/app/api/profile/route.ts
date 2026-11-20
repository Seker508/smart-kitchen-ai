import { z } from "zod";
import { json, parseJson, requireUser, route } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth/cookie";
import { deleteAccount, updateProfile } from "@/lib/services/users";
import { profileSchema } from "@/lib/validation";

export const GET = route(async (req) => json({ user: await requireUser(req) }));

export const PUT = route(async (req) => {
  const user = await requireUser(req);
  const input = await parseJson(req, profileSchema);
  return json({ user: await updateProfile(user.id, input) });
});

export const DELETE = route(async (req) => {
  const user = await requireUser(req);
  const { password } = await parseJson(req, z.object({ password: z.string().min(1).max(128) }));
  await deleteAccount(user.id, password);
  return clearSessionCookie(json({ ok: true }));
});

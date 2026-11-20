import { clientKey, json, parseJson, rateLimit, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth/cookie";
import { registerUser } from "@/lib/services/users";
import { registerSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  rateLimit(`register:${clientKey(req)}`, 10, 60 * 60_000);
  const input = await parseJson(req, registerSchema);
  const user = await registerUser(input);
  return setSessionCookie(json({ ok: true, user: { id: user.id, firstName: user.firstName } }, 201), user);
});

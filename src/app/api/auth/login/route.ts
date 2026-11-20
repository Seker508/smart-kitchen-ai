import { ApiError, clientKey, json, parseJson, rateLimit, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth/cookie";
import { authenticate } from "@/lib/services/users";
import { loginSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  const { email, password } = await parseJson(req, loginSchema);
  rateLimit(`login:${clientKey(req)}:${email}`, 8, 15 * 60_000);
  const user = await authenticate(email, password);
  if (!user) throw new ApiError(401, "E-posta veya şifre hatalı.", "BAD_CREDENTIALS");
  return setSessionCookie(json({ ok: true, user: { id: user.id, firstName: user.firstName } }), user);
});

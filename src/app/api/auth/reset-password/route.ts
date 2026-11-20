import { clientKey, json, parseJson, rateLimit, route } from "@/lib/api";
import { resetPassword } from "@/lib/services/users";
import { resetSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  rateLimit(`reset:${clientKey(req)}`, 10, 15 * 60_000);
  const { token, password } = await parseJson(req, resetSchema);
  await resetPassword(token, password);
  return json({ ok: true, message: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
});

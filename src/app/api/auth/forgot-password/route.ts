import { clientKey, json, parseJson, rateLimit, route } from "@/lib/api";
import { createResetToken } from "@/lib/services/users";
import { forgotSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  rateLimit(`forgot:${clientKey(req)}`, 5, 15 * 60_000);
  const { email } = await parseJson(req, forgotSchema);
  const token = await createResetToken(email);
  const base = process.env.APP_URL || new URL(req.url).origin;
  const link = token ? `${base}/sifre-sifirla?token=${encodeURIComponent(token)}` : null;
  // Hesabın var olup olmadığı bilgisini sızdırmamak için yanıt her durumda aynıdır.
  const body: Record<string, unknown> = {
    ok: true,
    message: "Bu e-posta adresiyle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı oluşturuldu.",
  };
  // Bu projede e-posta (SMTP) servisi yoktur. Geliştirme ortamında bağlantı ekranda gösterilir;
  // production ortamında hiçbir koşulda yanıt gövdesine eklenmez.
  const devShow = process.env.NODE_ENV !== "production" && process.env.SHOW_RESET_LINK_IN_DEV === "true";
  if (devShow && link) body.devResetLink = link;
  if (devShow) body.devNote = "Geliştirme modu: e-posta gönderilmez, bağlantı yalnızca burada gösterilir.";
  return json(body);
});

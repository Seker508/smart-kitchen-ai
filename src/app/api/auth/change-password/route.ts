import { json, parseJson, requireUser, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth/cookie";
import { changePassword } from "@/lib/services/users";
import { changePasswordSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { currentPassword, newPassword } = await parseJson(req, changePasswordSchema);
  const updated = await changePassword(user.id, currentPassword, newPassword);
  // Diğer cihazlardaki oturumlar geçersiz olur; bu oturum yeni çerezle devam eder.
  return setSessionCookie(json({ ok: true, message: "Şifreniz güncellendi." }), updated);
});

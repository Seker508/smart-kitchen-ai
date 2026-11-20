import { json, route } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth/cookie";

export const POST = route(async () => clearSessionCookie(json({ ok: true })));

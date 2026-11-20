// Edge (middleware) ve Node ortamlarında çalışan JWT yardımcıları
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "sk_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

export interface SessionPayload {
  sub: string; // kullanıcı id
  v: number; // tokenVersion
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET en az 32 karakter olmalıdır (.env).");
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ v: p.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setIssuer("smart-kitchen-ai")
    .sign(secret());
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "smart-kitchen-ai", algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.v !== "number") return null;
    return { sub: payload.sub, v: payload.v };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // HTTPS ile yayındaysa Secure; yerel ağda http ile test edilirken çerez çalışmaya devam etsin
    secure: process.env.NODE_ENV === "production" && (process.env.APP_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge,
  };
}

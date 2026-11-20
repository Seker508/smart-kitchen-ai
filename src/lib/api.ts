/**
 * API route yardımcıları: tek tip hata yönetimi, doğrulama, yetkilendirme ve CSRF koruması.
 */
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { SESSION_COOKIE } from "./auth/jwt";
import { userFromToken, type SessionUser } from "./auth/user";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "ERROR", public details?: unknown) {
    super(message);
  }
}

export const notFound = (what = "Kayıt") => new ApiError(404, `${what} bulunamadı.`, "NOT_FOUND");

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export async function getUserFromRequest(req: Request): Promise<SessionUser | null> {
  return userFromToken(readCookie(req, SESSION_COOKIE));
}

export async function requireUser(req: Request): Promise<SessionUser> {
  const u = await getUserFromRequest(req);
  if (!u) throw new ApiError(401, "Bu işlem için giriş yapmalısınız.", "UNAUTHORIZED");
  return u;
}

/**
 * CSRF koruması: durum değiştiren isteklerde Origin başlığı uygulamanın kendi adresi olmalıdır.
 * (Oturum çerezi ayrıca SameSite=Lax ve HttpOnly'dir.)
 */
export function assertSameOrigin(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // tarayıcı dışı istemciler (testler, curl) — çerez yine de gerekir
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new Error();
  } catch {
    throw new ApiError(403, "Geçersiz istek kaynağı.", "BAD_ORIGIN");
  }
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Geçersiz JSON gövdesi.", "BAD_JSON");
  }
  return schema.parse(body);
}

export function parseQuery<T>(req: Request, schema: ZodType<T>): T {
  const url = new URL(req.url);
  return schema.parse(Object.fromEntries(url.searchParams.entries()));
}

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: Request, ctx: Ctx<P>) => Promise<Response>;

/** Tüm route handler'ları sarmalar: hataları güvenli ve anlaşılır JSON yanıtlarına çevirir. */
export function route<P = Record<string, string>>(fn: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return json({ error: e.message, code: e.code, details: e.details }, e.status);
      }
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of e.issues) {
          const key = issue.path.join(".") || "_";
          fields[key] ??= issue.message;
        }
        return json({ error: "Lütfen form alanlarını kontrol edin.", code: "VALIDATION", fields }, 400);
      }
      // Hassas bilgi içermeyen loglama; istemciye ayrıntı gösterilmez
      console.error(`[api] ${req.method} ${new URL(req.url).pathname}:`, e instanceof Error ? e.message : "bilinmeyen hata");
      return json({ error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", code: "INTERNAL" }, 500);
    }
  };
}

// ---- Basit bellek içi hız sınırlayıcı (giriş/şifre sıfırlama/AI uçları için) ----
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > limit) {
    const sec = Math.ceil((b.reset - now) / 1000);
    throw new ApiError(429, `Çok fazla deneme yapıldı. ${sec} saniye sonra tekrar deneyin.`, "RATE_LIMIT");
  }
}
export function clientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
export function resetRateLimits() {
  buckets.clear();
}

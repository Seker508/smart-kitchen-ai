import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

const PROTECTED = ["/panel", "/envanter", "/fotograf", "/oneriler", "/tarifler", "/asistan", "/favoriler", "/alisveris", "/son-kullanma", "/profil", "/ayarlar"];

/**
 * Korumalı sayfalara oturumsuz erişimi giriş sayfasına yönlendirir.
 * (Çerez imzası burada doğrulanır; kullanıcı ve oturum sürümü kontrolü sunucu bileşenlerinde ve API'de veritabanından yapılır.)
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/giris";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!api|_next|icon.svg|favicon.ico|robots.txt|sitemap.xml).*)"] };

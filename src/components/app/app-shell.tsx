"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { NAV_ACCOUNT, NAV_MAIN, NAV_MOBILE, NAV_RECIPES, NAV_TOOLS, type NavItem } from "./nav-items";

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

function NavGroup({ title, items, path, onNavigate }: { title?: string; items: NavItem[]; path: string; onNavigate?: () => void }) {
  return (
    <div>
      {title && <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">{title}</p>}
      <ul className="space-y-0.5">
        {items.map((it) => {
          const active = isActive(path, it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition",
                  active ? "bg-forest-800 text-white shadow-sm" : "text-ink-600 hover:bg-cream-200/70 hover:text-forest-900")}>
                <it.icon size={18} className={cn(active ? "text-leaf-300" : "text-ink-400 group-hover:text-forest-700")} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AppShell({ user, children }: { user: { firstName: string; lastName: string; email: string }; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => setOpen(false), [path]);

  async function logout() {
    setLoggingOut(true);
    try { await api("/api/auth/logout", { method: "POST" }); } finally { router.replace("/giris"); router.refresh(); }
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toLocaleUpperCase("tr-TR");
  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 pb-4 pt-6 scrollbar-none">
      <Logo href="/panel" className="px-2" />
      <nav className="flex flex-1 flex-col gap-6" aria-label="Ana menü">
        <NavGroup items={NAV_MAIN} path={path} onNavigate={onNavigate} />
        <NavGroup title="Tarifler" items={NAV_RECIPES} path={path} onNavigate={onNavigate} />
        <NavGroup title="Araçlar" items={NAV_TOOLS} path={path} onNavigate={onNavigate} />
        <NavGroup title="Hesap" items={NAV_ACCOUNT} path={path} onNavigate={onNavigate} />
      </nav>
      <div className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-sm font-bold text-forest-800">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">{user.firstName} {user.lastName}</p>
          <p className="truncate text-xs text-ink-500">{user.email}</p>
        </div>
        <button onClick={logout} disabled={loggingOut} className="rounded-xl p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Çıkış yap" title="Çıkış yap">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-cream-300/70 bg-cream-50 lg:block">{sidebar()}</aside>

      {/* Mobil üst bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-cream-300/60 bg-cream-50/90 px-4 backdrop-blur lg:hidden">
        <Logo href="/panel" />
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-forest-800 hover:bg-cream-200" aria-label="Menüyü aç" aria-expanded={open}><Menu size={22} /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <div className="absolute inset-0 bg-forest-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] animate-fade-up bg-cream-50 shadow-lift">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 rounded-xl p-2 text-ink-500 hover:bg-cream-200" aria-label="Menüyü kapat"><X size={20} /></button>
            {sidebar(() => setOpen(false))}
          </div>
        </div>
      )}

      <main id="main" className="pb-28 lg:pb-12 lg:pl-[272px]">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</div>
      </main>

      {/* Mobil alt navigasyon */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-300/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Hızlı menü">
        <ul className="grid grid-cols-5">
          {NAV_MOBILE.map((it, i) => {
            const active = isActive(path, it.href) || (it.href.startsWith("/oneriler") && path.startsWith("/oneriler"));
            if (i === 2) {
              return (
                <li key={it.href} className="flex justify-center">
                  <Link href={it.href} aria-label={it.label} className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-lg shadow-accent-500/30 transition active:scale-95">
                    <it.icon size={24} />
                  </Link>
                </li>
              );
            }
            return (
              <li key={it.href}>
                <Link href={it.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold", active ? "text-forest-800" : "text-ink-400")}>
                  <it.icon size={21} />
                  {it.short ?? it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

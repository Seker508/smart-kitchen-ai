"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function MobileNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen((o) => !o)} className="rounded-xl p-2 text-forest-800 hover:bg-cream-200" aria-label={open ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={open}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-[72px] animate-fade-up border-b border-cream-300 bg-cream-50 px-5 pb-6 pt-2 shadow-card">
          <nav className="flex flex-col text-[15px] font-semibold text-ink-700" onClick={() => setOpen(false)}>
            <Link href="/" className="py-3">Ana Sayfa</Link>
            <a href="#nasil-calisir" className="py-3">Nasıl Çalışır?</a>
            <a href="#ozellikler" className="py-3">Özellikler</a>
            <a href="#tarifler" className="py-3">Tarifler</a>
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {!loggedIn && <ButtonLink href="/giris" variant="outline">Giriş Yap</ButtonLink>}
            <ButtonLink href={loggedIn ? "/panel" : "/kayit"} variant="accent" className={loggedIn ? "col-span-2" : ""}>{loggedIn ? "Panele git" : "Ücretsiz Başla"}</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

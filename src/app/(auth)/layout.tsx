import { redirect } from "next/navigation";
import { Camera, Leaf, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/panel");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)] xl:grid-cols-[1fr_640px]">
      <main id="main" className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px] animate-fade-up">{children}</div>
        </div>
        <p className="text-center text-xs text-ink-400">© {new Date().getFullYear()} Smart Kitchen AI · Bitirme Projesi</p>
      </main>
      <aside className="relative hidden overflow-hidden bg-forest-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <svg className="absolute -right-24 -top-24 h-[420px] w-[420px] text-forest-700" viewBox="0 0 200 200" aria-hidden><circle cx="100" cy="100" r="100" fill="currentColor" /></svg>
        <svg className="absolute -bottom-32 -left-20 h-[360px] w-[360px] text-forest-900/60" viewBox="0 0 200 200" aria-hidden><circle cx="100" cy="100" r="100" fill="currentColor" /></svg>
        <div className="relative">
          <span className="chip bg-white/10 text-leaf-200">🌿 İsrafı azalt, lezzeti keşfet</span>
          <h2 className="mt-6 max-w-md font-display text-[40px] font-semibold leading-[1.1] text-white">Buzdolabındakiler, bu akşamın menüsü olsun.</h2>
        </div>
        <ul className="relative space-y-4">
          {[
            { icon: Camera, t: "Fotoğrafla tanıma", d: "Buzdolabının fotoğrafını yükle, ürünler otomatik algılansın." },
            { icon: Sparkles, t: "Gerçek uyumluluk yüzdesi", d: "Elindeki malzemelere göre 100+ Türk mutfağı tarifi." },
            { icon: Leaf, t: "Son kullanma takibi", d: "Tarihi yaklaşan ürünleri değerlendiren tarifler öne çıkar." },
          ].map(({ icon: I, t, d }) => (
            <li key={t} className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white"><I size={20} /></span>
              <span><b className="block text-[15px]">{t}</b><span className="text-sm text-white/70">{d}</span></span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

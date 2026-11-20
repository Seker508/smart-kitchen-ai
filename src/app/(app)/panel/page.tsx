import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Camera, CalendarClock, ChefHat, Heart, Plus, Refrigerator, ShoppingBasket, Sparkles, Timer } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/states";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { requirePageUser } from "@/lib/auth/session";
import { getDashboard } from "@/lib/services/dashboard";
import { expiryLabel, expiryStatus } from "@/lib/expiry";
import { UNIT_LABELS } from "@/lib/constants";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Panel" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("tr-TR", { hour: "numeric", hour12: false, timeZone: "Europe/Istanbul" }).format(new Date()));
  return h < 5 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
}

function Section({ title, icon, href, linkText = "Tümünü gör", children }: { title: string; icon: React.ReactNode; href?: string; linkText?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-[22px] font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">{icon}</span>{title}
        </h2>
        {href && <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-800">{linkText}<ArrowRight size={15} /></Link>}
      </div>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requirePageUser();
  const d = await getDashboard(user.id);

  return (
    <>
      {/* A) Hoş geldin */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[32px] font-semibold leading-tight sm:text-[40px]">{greeting()}, <span className="text-accent-500">{user.firstName}</span></h1>
          <p className="mt-1.5 text-ink-500">
            {d.pantryEmpty ? "Mutfağını tanıtarak başlayalım." :
              d.stats.expiringSoon > 0 ? <>Son kullanma tarihi yaklaşan <b className="text-ink-800">{d.stats.expiringSoon} ürünün</b> var — onları değerlendirelim.</> :
                <>Elindeki malzemelerle <b className="text-ink-800">{d.stats.cookableCount} tarifi</b> hemen yapabilirsin.</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/envanter/ekle" variant="outline" icon={<Plus size={17} />}>Malzeme ekle</ButtonLink>
          <ButtonLink href="/asistan" variant="primary" icon={<Sparkles size={17} />}>Asistana sor</ButtonLink>
        </div>
      </div>

      {!d.ai.configured && (
        <Notice tone="warn" className="mt-6" icon={<AlertTriangle size={18} />} title="Yapay zekâ servisi yapılandırılmamış">
          Fotoğrafla tanıma şu an kullanılamıyor; asistan yanıtları öneri algoritmasıyla üretiliyor. Manuel malzeme ekleme ve tüm öneriler çalışmaya devam eder. Etkinleştirmek için sunucunun <code className="rounded bg-white/70 px-1">.env</code> dosyasına bir API anahtarı ekleyin.
        </Notice>
      )}

      {/* B, C) İstatistikler + fotoğraf alanı */}
      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_1.35fr]">
        {[
          { label: "Mutfağımdaki farklı ürün", value: d.stats.distinctProducts, icon: Refrigerator, href: "/envanter", tone: "bg-forest-50 text-forest-700" },
          { label: "Hemen yapılabilir tarif", value: d.stats.cookableCount, icon: ChefHat, href: "/oneriler/yemek", tone: "bg-leaf-100 text-forest-700" },
          { label: "SKT yaklaşan ürün", value: d.stats.expiringSoon, icon: CalendarClock, href: "/son-kullanma", tone: "bg-accent-50 text-accent-600", sub: d.stats.expired ? `${d.stats.expired} ürünün tarihi geçti` : undefined },
        ].map((s) => (
          <Link key={s.label} href={s.href} className={cn("card group flex flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-lift", s.href === "/son-kullanma" && "col-span-2 xl:col-span-1")}>
            <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", s.tone)}><s.icon size={21} /></span>
            <div className="mt-5">
              <p className="font-display text-[32px] font-semibold leading-none text-forest-900 sm:text-[40px]">{s.value}</p>
              <p className="mt-1.5 text-sm font-medium text-ink-500">{s.label}</p>
              {s.sub && <p className="mt-1 text-xs font-semibold text-red-600">{s.sub}</p>}
            </div>
          </Link>
        ))}
        <Link href="/fotograf" className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-forest-800 p-6 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift col-span-2 xl:col-span-1">
          <svg className="absolute -right-10 -top-10 h-44 w-44 text-forest-700" viewBox="0 0 100 100" aria-hidden><circle cx="50" cy="50" r="50" fill="currentColor" /></svg>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500"><Camera size={22} /></span>
          <div className="relative mt-5">
            <p className="font-display text-xl font-semibold">Fotoğrafla ürün tanıma</p>
            <p className="mt-1 text-sm text-white/70">Buzdolabının fotoğrafını yükle, ürünler otomatik algılansın.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-300">Fotoğraf yükle <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
          </div>
        </Link>
      </div>

      {d.pantryEmpty ? (
        <EmptyState className="mt-10" icon={<Refrigerator size={26} />} title="Mutfağın henüz boş"
          description="Önerilerin kişiselleşmesi için birkaç malzeme ekle ya da buzdolabının fotoğrafını yükle."
          action={<div className="flex flex-wrap justify-center gap-2"><ButtonLink href="/envanter/ekle" icon={<Plus size={17} />}>Malzeme ekle</ButtonLink><ButtonLink href="/fotograf" variant="outline" icon={<Camera size={17} />}>Fotoğraf yükle</ButtonLink></div>} />
      ) : (
        <>
          {/* D) Malzemelerimle ne pişirebilirim? */}
          <Section title="Malzemelerimle ne pişirebilirim?" icon={<ChefHat size={18} />} href="/tarifler">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{d.canCook.map((x) => <RecipeCard key={x.recipe.id} {...x} />)}</div>
          </Section>

          {/* G) SKT yaklaşan ürünler */}
          <div className="mt-10 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold"><CalendarClock size={20} className="text-accent-500" />Son kullanma tarihi yaklaşanlar</h2>
                <Link href="/son-kullanma" className="text-sm font-semibold text-forest-600 hover:text-forest-800">Takibe git</Link>
              </div>
              {d.expiring.length === 0 && d.expiredItems.length === 0 ? (
                <p className="rounded-2xl bg-leaf-50 p-4 text-sm font-medium text-forest-800">Harika! Önümüzdeki 7 gün içinde tarihi dolan ürünün yok. 🌿</p>
              ) : (
                <ul className="divide-y divide-cream-200">
                  {[...d.expiredItems, ...d.expiring].map((i) => {
                    const st = expiryStatus(i.expiresAt);
                    return (
                      <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("h-9 w-1.5 rounded-full", st === "expired" ? "bg-red-500" : st === "urgent" ? "bg-accent-500" : "bg-amber-300")} />
                          <div>
                            <p className="font-semibold capitalize text-ink-900">{i.name}</p>
                            <p className="text-xs text-ink-500">{formatQuantity(i.quantity)} {UNIT_LABELS[i.unit]} · {i.categoryName}</p>
                          </div>
                        </div>
                        <span className={cn("chip", st === "expired" ? "bg-red-50 text-red-700" : st === "urgent" ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-800")}>{expiryLabel(i.expiresAt)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* J) Alışveriş listem */}
            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold"><ShoppingBasket size={20} className="text-accent-500" />Eksiklerim</h2>
                <Link href="/alisveris" className="text-sm font-semibold text-forest-600 hover:text-forest-800">Listeyi aç</Link>
              </div>
              {d.shopping.length === 0 ? (
                <p className="text-sm text-ink-500">Alışveriş listen boş. Tarif sayfalarından eksik malzemeleri tek tıkla ekleyebilirsin.</p>
              ) : (
                <ul className="space-y-2">
                  {d.shopping.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-2xl bg-cream-50 px-4 py-2.5 text-sm">
                      <span className="font-semibold capitalize">{s.name}</span>
                      <span className="text-ink-500">{s.quantity != null ? `${formatQuantity(s.quantity)} ${s.unit ? UNIT_LABELS[s.unit] : ""}` : ""}</span>
                    </li>
                  ))}
                  {d.stats.shoppingOpen > d.shopping.length && <li className="pt-1 text-xs text-ink-500">+{d.stats.shoppingOpen - d.shopping.length} ürün daha</li>}
                </ul>
              )}
            </section>
          </div>

          {/* E) Bugünün yemek önerileri */}
          <Section title="Bugünün yemek önerileri" icon={<ChefHat size={18} />} href="/oneriler/yemek">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{d.meals.map((x) => <RecipeCard key={x.recipe.id} {...x} />)}</div>
          </Section>

          {/* F) Bugünün tatlı önerileri */}
          <Section title="Bugünün tatlı önerileri" icon={<Sparkles size={18} />} href="/oneriler/tatli">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{d.desserts.map((x) => <RecipeCard key={x.recipe.id} {...x} />)}</div>
          </Section>

          {/* H) En hızlı */}
          {d.quickest.length > 0 && (
            <Section title="En hızlı hazırlanabilecekler" icon={<Timer size={18} />} href="/tarifler?sort=sure">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{d.quickest.map((x) => <RecipeCard key={x.recipe.id} {...x} compact />)}</div>
            </Section>
          )}
        </>
      )}

      {/* I) Favoriler */}
      <Section title="Favori tariflerim" icon={<Heart size={18} />} href={d.favorites.length ? "/favoriler" : undefined}>
        {d.favorites.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{d.favorites.map((x) => <RecipeCard key={x.recipe.id} recipe={x.recipe} match={x.match} isFavorite compact />)}</div>
        ) : (
          <EmptyState icon={<Heart size={24} />} title="Henüz favorin yok" description="Beğendiğin tariflerdeki kalp simgesine dokunarak buraya ekleyebilirsin." action={<ButtonLink href="/tarifler" variant="outline">Tariflere göz at</ButtonLink>} />
        )}
      </Section>
    </>
  );
}

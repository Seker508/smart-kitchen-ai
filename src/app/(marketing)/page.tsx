import Link from "next/link";
import { ArrowRight, BellRing, Camera, Check, ChefHat, Clock, Leaf, PiggyBank, Refrigerator, ShieldCheck, ShoppingBasket, Sparkles, Timer } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { CompatRing } from "@/components/recipes/compat";
import { RecipeImage } from "@/components/recipes/recipe-image";
import { getCurrentUser } from "@/lib/auth/session";
import { loadAllRecipes, stripIngredients, type RecipeSummary } from "@/lib/services/recipes";
import { MobileNav } from "./mobile-nav";

export const dynamic = "force-dynamic";

const SAMPLE_SLUGS = ["menemen", "mercimek-corbasi", "karniyarik", "sutlac", "mucver", "irmik-helvasi", "kuru-fasulye", "pankek"];

async function sampleRecipes(): Promise<{ list: RecipeSummary[]; total: number }> {
  try {
    const all = await loadAllRecipes();
    const list = SAMPLE_SLUGS.map((s) => all.find((r) => r.slug === s)).filter(Boolean).map((r) => stripIngredients(r!));
    return { list, total: all.length };
  } catch {
    return { list: [], total: 0 };
  }
}

const FAQ = [
  { q: "Fotoğraftan ürün tanıma nasıl çalışıyor?", a: "Yüklediğin fotoğraf, sunucumuz üzerinden görsel analiz yapabilen bir yapay zekâ modeline gönderilir. Model gördüğü gıda ürünlerini güven skoruyla listeler; emin olmadığı ürünleri ayrıca işaretler. Hiçbir ürün sen onaylamadan envanterine eklenmez." },
  { q: "Uyumluluk yüzdesi neye göre hesaplanıyor?", a: "Tarifteki zorunlu malzemelerden kaçının mutfağında bulunduğu sayılır. Örneğin Menemen'in 5 malzemesinden 4'ü varsa uyum %80'dir. Ana malzeme eksikse tarif ayrıca 'ana malzeme eksik' olarak işaretlenir; miktar yeterliliği de birim dönüştürülerek kontrol edilir." },
  { q: "Tarifler nereden geliyor?", a: "Uygulamadaki tarifler, Türk mutfağına ağırlık veren ve projeye özel hazırlanmış bir tarif veritabanından gelir. Yapay zekâ asistanı bir tarif önerdiğinde bu veritabanıyla eşleştirilir; veritabanında olmayan fikirler ayrıca belirtilir." },
  { q: "Alerjen bilgilerine güvenebilir miyim?", a: "Alerjen bilgileri tarif içeriğindeki malzemelerden hesaplanır, yapay zekâ tahmini değildir. Yine de ürün etiketleri markaya göre değişebileceği için kullandığın ürünlerin etiketini kontrol etmeni öneririz." },
  { q: "Verilerim güvende mi?", a: "Şifreler güvenli hash algoritmasıyla saklanır, oturum çerezleri HttpOnly'dir ve her kullanıcının envanteri, favorileri ve sohbetleri yalnızca kendisi tarafından görülebilir. API anahtarları yalnızca sunucuda tutulur." },
  { q: "Ücretli mi?", a: "Smart Kitchen AI bir bitirme projesidir ve ücretsizdir. Fotoğraf analizi ve sohbet asistanı için sunucu yöneticisinin bir yapay zekâ API anahtarı tanımlaması gerekir." },
];

export default async function Landing() {
  const [{ list: samples, total }, user] = await Promise.all([sampleRecipes(), getCurrentUser().catch(() => null)]);
  const cta = user ? { href: "/panel", label: "Panele git" } : { href: "/kayit", label: "Ücretsiz Başla" };

  return (
    <div className="bg-cream-100">
      {/* Navigasyon */}
      <header className="sticky top-0 z-40 border-b border-cream-300/50 bg-cream-100/85 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-[15px] font-semibold text-ink-600 md:flex" aria-label="Ana menü">
            <Link href="/" className="text-forest-900">Ana Sayfa</Link>
            <a href="#nasil-calisir" className="transition hover:text-forest-900">Nasıl Çalışır?</a>
            <a href="#ozellikler" className="transition hover:text-forest-900">Özellikler</a>
            <a href="#tarifler" className="transition hover:text-forest-900">Tarifler</a>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {!user && <ButtonLink href="/giris" variant="ghost">Giriş Yap</ButtonLink>}
            <ButtonLink href={cta.href} variant="accent">{cta.label}</ButtonLink>
          </div>
          <MobileNav loggedIn={!!user} />
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
            <div className="animate-fade-up">
              <span className="chip bg-leaf-100 text-forest-800"><Sparkles size={13} /> Yapay zekâ destekli akıllı mutfak</span>
              <h1 className="mt-5 font-display text-[42px] font-semibold leading-[1.05] text-forest-900 text-balance sm:text-[58px] lg:text-[64px]">
                Mutfağındaki Malzemelerden <span className="relative whitespace-nowrap text-accent-500">Yeni Lezzetler<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden><path d="M2 9c60-6 140-8 296-3" stroke="#A9CD88" strokeWidth="5" fill="none" strokeLinecap="round" /></svg></span> Keşfet!
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
                Evindeki malzemeleri tanıt, yapay zekânın sana özel yemek ve tatlı önerilerini keşfet. İsrafı azalt, mutfağını daha akıllı kullan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={cta.href} variant="accent" size="lg" icon={<Sparkles size={18} />}>Hemen Keşfet</ButtonLink>
                <ButtonLink href="#nasil-calisir" variant="outline" size="lg">Nasıl Çalışır?</ButtonLink>
              </div>
              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-600">
                {[`${total || "100"}+ Türk mutfağı tarifi`, "Fotoğrafla ürün tanıma", "Gerçek uyumluluk yüzdesi"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-800 text-white"><Check size={12} /></span>{t}</li>
                ))}
              </ul>
            </div>

            {/* Hero görseli: gerçek arayüz bileşenlerinden oluşan kompozisyon */}
            <div className="relative mx-auto w-full max-w-[540px]" aria-hidden>
              <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-lift">
                <RecipeImage emoji="🍳" title="Menemen" categorySlug="kahvaltilik" size="lg" />
              </div>
              <div className="absolute -left-4 top-10 w-56 animate-fade-up rounded-3xl bg-white p-4 shadow-lift sm:-left-10" style={{ animationDelay: ".15s" }}>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-400"><Camera size={13} />Fotoğraftan algılandı</p>
                {[["🥚", "Yumurta", 97], ["🍅", "Domates", 94], ["🫑", "Sivri biber", 88]].map(([e, n, c]) => (
                  <div key={n as string} className="mt-3 flex items-center gap-3">
                    <span className="text-xl">{e}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-[13px] font-semibold"><span>{n}</span><span className="text-forest-600">%{c}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-cream-200"><div className="h-full rounded-full bg-forest-500" style={{ width: `${c}%` }} /></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute -right-3 bottom-16 flex w-60 animate-fade-up items-center gap-3 rounded-3xl bg-white p-4 shadow-lift sm:-right-8" style={{ animationDelay: ".3s" }}>
                <CompatRing value={80} size={56} />
                <div>
                  <p className="font-display text-[17px] font-semibold text-forest-900">Menemen</p>
                  <p className="text-xs text-ink-500">4/5 malzeme mevcut · 20 dk</p>
                  <p className="mt-1 text-xs font-semibold text-accent-600">Eksik: soğan</p>
                </div>
              </div>
              <div className="absolute -bottom-5 left-8 flex animate-fade-up items-center gap-2.5 rounded-2xl bg-forest-800 px-4 py-3 text-white shadow-lift" style={{ animationDelay: ".45s" }}>
                <BellRing size={17} className="text-accent-400" />
                <span className="text-sm font-semibold">Süt · 2 gün kaldı</span>
              </div>
            </div>
          </div>
        </section>

        {/* Nasıl çalışır */}
        <section id="nasil-calisir" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-600">Nasıl çalışır?</p>
              <h2 className="mt-3 font-display text-4xl font-semibold sm:text-[44px]">Üç adımda akşam yemeği hazır</h2>
            </div>
            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                { icon: Refrigerator, t: "Malzemelerini tanıt", d: "Ürünlerini listeden seçerek ekle ya da buzdolabının fotoğrafını yükle; yapay zekâ ürünleri algılasın, sen onayla." },
                { icon: Sparkles, t: "Akıllı önerileri gör", d: "Algoritma 100+ tarifi senin envanterinle karşılaştırır; uyumluluk yüzdesi, eksik malzemeler ve hazırlanabilirlik durumu anında hesaplanır." },
                { icon: ChefHat, t: "Pişir, israf etme", d: "Adım adım tarifi takip et, eksikleri tek tıkla alışveriş listesine ekle, tarihi yaklaşan ürünleri öncelikle değerlendir." },
              ].map((s, i) => (
                <li key={s.t} className="relative rounded-[2rem] border border-cream-300/70 bg-cream-50 p-7">
                  <span className="absolute right-6 top-5 font-display text-6xl font-semibold text-cream-300">{i + 1}</span>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-800 text-leaf-300"><s.icon size={26} /></span>
                  <h3 className="mt-6 font-display text-xl font-semibold">{s.t}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Özellikler */}
        <section id="ozellikler" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl space-y-24 px-5 sm:px-8">
            {/* Fotoğrafla tanıma */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="chip bg-accent-50 text-accent-700"><Camera size={13} />Fotoğrafla ürün tanıma</span>
                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">Buzdolabının fotoğrafını çek, gerisini yapay zekâya bırak</h2>
                <p className="mt-4 text-lg leading-relaxed text-ink-600">Buzdolabı, mutfak dolabı ya da tezgâh fotoğrafındaki gıdalar algılanır; her ürün için kategori ve güven skoru gösterilir. Emin olunamayan ürünler kesin tanım gibi sunulmaz, alternatifleriyle birlikte onayına bırakılır.</p>
                <ul className="mt-6 space-y-3">
                  {["JPG, JPEG, PNG ve WEBP desteği", "Ürün adını düzenle, yanlışı sil, eksiği ekle", "Onaylananlar tek tıkla envantere kaydedilir"].map((t) => (
                    <li key={t} className="flex items-center gap-3 font-medium text-ink-700"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf-100 text-forest-700"><Check size={14} /></span>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-6 sm:p-8" aria-hidden>
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl font-semibold">Algılanan ürünler</p>
                  <span className="chip bg-leaf-100 text-forest-800">6 ürün</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[["🥚", "Yumurta", "Süt ürünleri", 97], ["🥛", "Süt", "Süt ürünleri", 93], ["🍅", "Domates", "Sebzeler", 95], ["🫑", "Sivri biber", "Sebzeler", 86], ["🧀", "Beyaz peynir", "Süt ürünleri", 74], ["🥣", "Yoğurt?", "Emin değil · labne olabilir", 52]].map(([e, n, c, p]) => (
                    <div key={n as string} className={`flex items-center gap-3 rounded-2xl border p-3 ${(p as number) < 60 ? "border-amber-200 bg-amber-50" : "border-cream-300 bg-cream-50"}`}>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl">{e}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{n}</p>
                        <p className="truncate text-xs text-ink-500">{c}</p>
                      </div>
                      <span className={`text-sm font-bold ${(p as number) < 60 ? "text-amber-700" : "text-forest-600"}`}>%{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Akıllı öneriler */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 grid grid-cols-2 gap-4 lg:order-1" aria-hidden>
                {[{ t: "Mercimek Çorbası", e: "🥣", c: "corba", v: 100, m: "Hemen yapılabilir" }, { t: "Karnıyarık", e: "🍆", c: "ana-yemek", v: 64, m: "4 malzeme eksik" }, { t: "Sütlaç", e: "🍮", c: "tatli", v: 86, m: "1 malzeme eksik" }, { t: "Mücver", e: "🥒", c: "atistirmalik", v: 71, m: "2 malzeme eksik" }].map((r) => (
                  <div key={r.t} className="card overflow-hidden p-0">
                    <div className="aspect-[4/3]"><RecipeImage emoji={r.e} title={r.t} categorySlug={r.c} size="sm" /></div>
                    <div className="flex items-center justify-between gap-2 p-3.5">
                      <div className="min-w-0"><p className="truncate font-display font-semibold">{r.t}</p><p className="text-xs text-ink-500">{r.m}</p></div>
                      <CompatRing value={r.v} size={44} stroke={4} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-1 lg:order-2">
                <span className="chip bg-leaf-100 text-forest-800"><Sparkles size={13} />Akıllı tarif önerileri</span>
                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">Sadece tarif değil, senin mutfağına göre tarif</h2>
                <p className="mt-4 text-lg leading-relaxed text-ink-600">Öneri algoritması mevcut ve eksik malzemeleri, miktarları, hazırlama süresini, zorluğu, beslenme tercihlerini ve son kullanma tarihlerini birlikte değerlendirir.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[{ i: Timer, t: "En kısa sürede hazırlananlar" }, { i: PiggyBank, t: "En ekonomik tarifler" }, { i: ShoppingBasket, t: "En az eksik malzeme" }, { i: ShieldCheck, t: "Diyet ve alerjen filtresi" }].map(({ i: I, t }) => (
                    <div key={t} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 text-sm font-semibold shadow-card"><I size={18} className="text-accent-500" />{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* İsraf azaltma */}
        <section className="px-5 sm:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-forest-800 px-6 py-14 text-white sm:px-14 sm:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="chip bg-white/10 text-leaf-200"><Leaf size={13} />Gıda israfını azaltma sistemi</span>
                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-white">Son kullanma tarihini kaçırma, değerlendir</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">Ürünlerin üç grupta takip edilir: yaklaşanlar, öncelikli değerlendirilmesi gerekenler ve tarihi geçmişler. Tarihi yaklaşan süt, yoğurt ya da sebzeleri kullanan tarifler öne çıkar; tarihi geçmiş ürünler için tüketim önerisi yapılmaz.</p>
              </div>
              <div className="space-y-3" aria-hidden>
                {[["Öncelikli", "Domates · yarın son gün", "bg-red-400"], ["Yaklaşan", "Yoğurt · 4 gün kaldı", "bg-accent-400"], ["Takipte", "Beyaz peynir · 15 gün kaldı", "bg-leaf-400"]].map(([g, t, c]) => (
                  <div key={g} className="flex items-center gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                    <span className={`h-10 w-1.5 rounded-full ${c}`} />
                    <div><p className="text-xs font-bold uppercase tracking-wider text-white/50">{g}</p><p className="font-semibold">{t}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Faydalar */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="text-center font-display text-4xl font-semibold">Sana sağladıkları</h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { i: PiggyBank, t: "Bütçeni korur", d: "Elindekini değerlendirdikçe gereksiz alışveriş azalır." },
                { i: Leaf, t: "İsrafı azaltır", d: "Tarihi yaklaşan ürünler zamanında tabağa dönüşür." },
                { i: Clock, t: "Zaman kazandırır", d: "'Bugün ne pişirsem?' sorusu saniyeler içinde yanıtlanır." },
                { i: Sparkles, t: "Sana özel", d: "Vejetaryen, vegan, glutensiz ve alerji tercihlerine uyar." },
              ].map(({ i: I, t, d }) => (
                <div key={t} className="card p-6 transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600"><I size={22} /></span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Örnek tarifler (veritabanından) */}
        <section id="tarifler" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-600">Tarifler</p>
                <h2 className="mt-3 font-display text-4xl font-semibold">Türk mutfağının sevilenleri</h2>
                <p className="mt-2 text-ink-600">Veritabanımızdaki {total || "100+"} tariften birkaçı.</p>
              </div>
              <ButtonLink href={cta.href} variant="outline" icon={<ArrowRight size={17} />}>Tümünü keşfet</ButtonLink>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {samples.map((r) => (
                <Link key={r.slug} href={user ? `/tarifler/${r.slug}` : "/kayit"} className="group card overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="aspect-[4/3]"><RecipeImage emoji={r.emoji} title={r.title} categorySlug={r.categorySlug} /></div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-accent-600">{r.categoryName}</p>
                    <h3 className="mt-0.5 font-display text-lg font-semibold group-hover:text-forest-700">{r.title}</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-500"><Clock size={13} />{r.totalMinutes} dk · {r.servings} kişilik</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SSS */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-center font-display text-4xl font-semibold">Sıkça sorulan sorular</h2>
            <div className="mt-10 space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group card p-0 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-semibold text-forest-900">
                    {f.q}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-200 text-lg transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 leading-relaxed text-ink-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 rounded-[2.5rem] bg-accent-500 px-6 py-14 text-center text-white">
            <h2 className="max-w-2xl font-display text-4xl font-semibold leading-tight text-white">Bu akşam ne pişireceğine buzdolabın karar versin.</h2>
            <ButtonLink href={cta.href} size="lg" variant="outline" className="border-0">{cta.label}</ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-cream-300/70 bg-cream-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5"><LogoMark /><span className="font-display text-lg font-semibold">Smart Kitchen AI</span></div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">Yapay zekâ destekli akıllı mutfak, malzeme tanıma ve yemek öneri platformu. Üniversite bitirme projesi.</p>
          </div>
          <div>
            <p className="text-sm font-bold text-forest-900">Ürün</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><a href="#nasil-calisir" className="hover:text-forest-800">Nasıl çalışır?</a></li>
              <li><a href="#ozellikler" className="hover:text-forest-800">Özellikler</a></li>
              <li><a href="#tarifler" className="hover:text-forest-800">Tarifler</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-forest-900">Hesap</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/giris" className="hover:text-forest-800">Giriş yap</Link></li>
              <li><Link href="/kayit" className="hover:text-forest-800">Kayıt ol</Link></li>
              <li><Link href="/sifremi-unuttum" className="hover:text-forest-800">Şifremi unuttum</Link></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-cream-300/70 py-6 text-center text-xs text-ink-400">© {new Date().getFullYear()} Smart Kitchen AI. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Toggle } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/client";
import { cn } from "@/lib/cn";
import { ALLERGEN_LABELS } from "@/lib/constants";

type Prefs = { vegetarian: boolean; vegan: boolean; glutenFree: boolean; lactoseFree: boolean; lowBudget: boolean; quickMeals: boolean; healthy: boolean; allergens: string[]; allergyNotes: string };

const DIET: { k: keyof Prefs; l: string; d: string }[] = [
  { k: "vegetarian", l: "Vejetaryen", d: "Et, tavuk ve balık içeren tarifleri gizle." },
  { k: "vegan", l: "Vegan", d: "Hayvansal ürün içeren tüm tarifleri gizle." },
  { k: "glutenFree", l: "Glutensiz", d: "Gluten içeren malzemeli tarifleri gizle." },
  { k: "lactoseFree", l: "Laktozsuz", d: "Süt ve süt ürünü içeren tarifleri gizle." },
];
const STYLE: { k: keyof Prefs; l: string; d: string }[] = [
  { k: "lowBudget", l: "Düşük bütçeli tarifler", d: "Ekonomik tarifleri öne çıkar." },
  { k: "quickMeals", l: "Pratik yemekler", d: "30 dakika ve altı tarifleri öne çıkar." },
  { k: "healthy", l: "Sağlıklı beslenme", d: "Çorba ve salataları öne çıkar, tatlıları geriye al." },
];

export function ProfileView({ user, prefs: initial, stats }: { user: { firstName: string; lastName: string; email: string; createdAt: string }; prefs: Prefs; stats: { distinctProducts: number } }) {
  const router = useRouter();
  const toast = useToast();
  const [p, setP] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  const [pErr, setPErr] = useState<Record<string, string>>({});
  const [savingP, setSavingP] = useState(false);
  const [prefs, setPrefs] = useState(initial);
  const [savingPref, setSavingPref] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingP(true); setPErr({});
    try { await api("/api/profile", { method: "PUT", body: p }); toast("Profil güncellendi"); router.refresh(); }
    catch (err) { setPErr(err instanceof ApiClientError ? err.fields ?? { _: err.message } : { _: "Kaydedilemedi" }); }
    finally { setSavingP(false); }
  }
  async function savePrefs() {
    setSavingPref(true);
    try {
      await api("/api/preferences", { method: "PUT", body: { ...prefs, allergyNotes: prefs.allergyNotes || null } });
      toast("Tercihlerin kaydedildi; öneriler buna göre güncellenecek.");
    } catch (e) { toast((e as Error).message, "error"); } finally { setSavingPref(false); }
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toLocaleUpperCase("tr-TR");
  return (
    <>
      <PageHeader eyebrow="Hesap" title="Profilim" description="Kişisel bilgilerin ve tarif önerilerini kişiselleştiren beslenme tercihlerin." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <div className="card flex items-center gap-4 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-forest-800 font-display text-2xl font-semibold text-leaf-300">{initials}</div>
            <div>
              <p className="font-display text-xl font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-ink-500">Üyelik: {new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} · {stats.distinctProducts} ürün</p>
            </div>
          </div>
          <form className="card space-y-4 p-6" onSubmit={saveProfile} noValidate>
            <h2 className="font-display text-xl font-semibold">Kişisel bilgiler</h2>
            {pErr._ && <Notice tone="danger">{pErr._}</Notice>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad" htmlFor="fn" error={pErr.firstName}><Input id="fn" value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} /></Field>
              <Field label="Soyad" htmlFor="ln" error={pErr.lastName}><Input id="ln" value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} /></Field>
            </div>
            <Field label="E-posta" htmlFor="em" error={pErr.email}><Input id="em" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></Field>
            <Button type="submit" loading={savingP} icon={<Check size={17} />}>Kaydet</Button>
          </form>
        </div>

        <div className="card space-y-7 p-6 sm:p-8">
          <div>
            <h2 className="font-display text-xl font-semibold">Beslenme tercihleri</h2>
            <p className="mt-1 text-sm text-ink-500">Seçtiğin tercihlere uymayan tarifler önerilerde gizlenir (istersen &quot;tercihlerime uymayanları da göster&quot; ile görebilirsin).</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DIET.map(({ k, l, d }) => <Toggle key={k} id={k} label={l} description={d} checked={prefs[k] as boolean} onChange={(v) => setPrefs({ ...prefs, [k]: v, ...(k === "vegan" && v ? { vegetarian: true } : {}) })} />)}
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Mutfak tarzım</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {STYLE.map(({ k, l, d }) => <Toggle key={k} id={k} label={l} description={d} checked={prefs[k] as boolean} onChange={(v) => setPrefs({ ...prefs, [k]: v })} />)}
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Alerji ve intoleranslar</h2>
            <p className="mt-1 text-sm text-ink-500">Seçtiğin alerjenleri içeren tarifler önerilerden çıkarılır ve tarif sayfasında uyarı gösterilir.</p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Alerjenler">
              {Object.entries(ALLERGEN_LABELS).map(([code, label]) => {
                const on = prefs.allergens.includes(code);
                return (
                  <button key={code} type="button" aria-pressed={on} onClick={() => setPrefs({ ...prefs, allergens: on ? prefs.allergens.filter((a) => a !== code) : [...prefs.allergens, code] })}
                    className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", on ? "bg-red-600 text-white" : "bg-white text-ink-700 ring-1 ring-cream-300 hover:bg-cream-50")}>
                    {on && "✓ "}{label}
                  </button>
                );
              })}
            </div>
            <Field label="Ek notlar" htmlFor="an" className="mt-4" hint="ör. 'çiğ domates hassasiyeti'. Bu not otomatik filtrelemede kullanılmaz; kendi hatırlatman içindir.">
              <Input id="an" maxLength={500} value={prefs.allergyNotes} onChange={(e) => setPrefs({ ...prefs, allergyNotes: e.target.value })} />
            </Field>
            <Notice tone="warn" className="mt-4" icon={<ShieldAlert size={18} />}>
              Alerjen bilgileri tarif malzemelerinden hesaplanır, yapay zekâ tahmini değildir. Ancak ürün içerikleri markaya göre değişebilir; her zaman etiketi kontrol et.
            </Notice>
          </div>
          <div className="flex justify-end border-t border-cream-200 pt-5"><Button onClick={savePrefs} loading={savingPref} icon={<Check size={17} />}>Tercihleri kaydet</Button></div>
        </div>
      </div>
    </>
  );
}

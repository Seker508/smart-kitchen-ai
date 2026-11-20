"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, ChefHat, Circle, Clock, Flame, Leaf, Minus, Plus, ShoppingBasket, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { CompatRing, ReadinessBadge } from "@/components/recipes/compat";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { RecipeImage } from "@/components/recipes/recipe-image";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { ALLERGEN_LABELS, DIFFICULTY_LABELS, UNIT_LABELS } from "@/lib/constants";
import { READINESS_LABELS } from "@/lib/recommend";
import type { RecipeDetail } from "@/lib/services/recipes";
import { formatQuantity, scaleQuantity } from "@/lib/units";

export function RecipeDetailView({ recipe: r }: { recipe: RecipeDetail }) {
  const toast = useToast();
  const [servings, setServings] = useState(r.servings);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const m = r.match;
  const status = useMemo(() => {
    const map = new Map<number, "have" | "missing" | "low">();
    m?.have.forEach((h) => map.set(h.ingredientId, h.sufficient === false ? "low" : "have"));
    m?.missing.forEach((x) => map.set(x.ingredientId, "missing"));
    m?.missingOptional.forEach((x) => map.set(x.ingredientId, "missing"));
    return map;
  }, [m]);
  const conflicts = r.allergens.filter((a) => r.userAllergens.includes(a));

  async function addToShopping() {
    setAdding(true);
    try {
      const res = await api<{ message: string }>("/api/shopping-list/from-recipe", { body: { recipeId: r.id, servings } });
      toast(res.message, "success");
    } catch (e) { toast((e as Error).message, "error"); } finally { setAdding(false); }
  }

  return (
    <article>
      <Link href="/tarifler" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-forest-800"><ArrowLeft size={16} />Tariflere dön</Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card lg:aspect-auto lg:min-h-[420px]">
          <RecipeImage emoji={r.emoji} title={r.title} categorySlug={r.category.slug} imageUrl={r.imageUrl} size="lg" />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-accent-50 text-accent-700">{r.category.name}</span>
            {r.isVegan ? <span className="chip bg-leaf-100 text-forest-800"><Leaf size={12} />Vegan</span> : r.isVegetarian && <span className="chip bg-leaf-100 text-forest-800"><Leaf size={12} />Vejetaryen</span>}
            {r.isGlutenFree && <span className="chip bg-cream-200 text-ink-700">Glutensiz</span>}
            {r.isLactoseFree && <span className="chip bg-cream-200 text-ink-700">Laktozsuz</span>}
          </div>
          <h1 className="mt-3 font-display text-[36px] font-semibold leading-tight sm:text-[44px]">{r.title}</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-600">{r.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { i: Timer, l: "Hazırlık", v: `${r.prepMinutes} dk` }, { i: Flame, l: "Pişirme", v: `${r.cookMinutes} dk` },
              { i: Clock, l: "Toplam", v: `${r.totalMinutes} dk` }, { i: ChefHat, l: "Zorluk", v: DIFFICULTY_LABELS[r.difficulty] },
            ].map(({ i: I, l, v }) => (
              <div key={l} className="rounded-2xl bg-white p-3.5 shadow-card">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-500"><I size={14} />{l}</dt>
                <dd className="mt-1 font-display text-lg font-semibold text-forest-900">{v}</dd>
              </div>
            ))}
          </dl>
          {m && (
            <div className="mt-5 flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
              <CompatRing value={m.compatibility} size={68} stroke={6} />
              <div className="flex-1">
                <p className="font-semibold text-ink-900">Malzeme uyumu: %{m.compatibility} <span className="font-normal text-ink-500">({m.haveCount}/{m.requiredCount} malzeme)</span></p>
                <div className="mt-1.5"><ReadinessBadge readiness={m.readiness} missingCount={m.missing.length} /></div>
                <p className="mt-1 text-xs text-ink-500">{READINESS_LABELS[m.readiness]}{m.missingEssential && " — ana malzeme olmadan bu tarif hazırlanamaz."}</p>
              </div>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <FavoriteButton recipeId={r.id} initial={r.isFavorite} variant="full" />
            <Button variant="accent" onClick={addToShopping} loading={adding} icon={<ShoppingBasket size={18} />} disabled={!!m && m.missing.length === 0 && m.insufficientCount === 0}>
              {m && m.missing.length === 0 && m.insufficientCount === 0 ? "Eksik malzeme yok" : "Eksikleri alışveriş listesine ekle"}
            </Button>
          </div>
        </div>
      </div>

      {(conflicts.length > 0 || r.allergens.length > 0) && (
        <Notice tone={conflicts.length ? "danger" : "warn"} className="mt-8" icon={<AlertTriangle size={18} />}
          title={conflicts.length ? `Dikkat: alerjilerinle çakışıyor (${conflicts.map((a) => ALLERGEN_LABELS[a]).join(", ")})` : "Alerjen bilgisi"}>
          Bu tarif şu alerjenleri içerir: <b>{r.allergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(", ")}</b>. Bilgi, tarifteki malzemelerden hesaplanmıştır; kullandığın ürünlerin etiketlerini mutlaka kontrol et.
        </Notice>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <section className="card h-fit p-6 lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Malzemeler</h2>
            <div className="flex items-center gap-1 rounded-2xl border border-cream-300 p-1" aria-label="Porsiyon">
              <button onClick={() => setServings((s) => Math.max(1, s - 1))} className="rounded-xl p-1.5 hover:bg-cream-100" aria-label="Porsiyonu azalt"><Minus size={15} /></button>
              <span className="flex min-w-[78px] items-center justify-center gap-1 text-sm font-semibold" aria-live="polite"><Users size={14} />{servings} kişilik</span>
              <button onClick={() => setServings((s) => Math.min(50, s + 1))} className="rounded-xl p-1.5 hover:bg-cream-100" aria-label="Porsiyonu artır"><Plus size={15} /></button>
            </div>
          </div>
          {servings !== r.servings && <p className="mt-2 text-xs text-ink-500">Miktarlar {r.servings} kişilik orijinal tariften otomatik hesaplandı. <button className="link" onClick={() => setServings(r.servings)}>Sıfırla</button></p>}
          <ul className="mt-4 divide-y divide-cream-200">
            {r.ingredients.map((i) => {
              const st = i.alwaysAvailable ? "have" : status.get(i.ingredientId);
              const q = scaleQuantity(i.quantity, r.servings, servings);
              return (
                <li key={i.ingredientId} className="flex items-center gap-3 py-2.5">
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    st === "have" ? "bg-leaf-100 text-forest-700" : st === "low" ? "bg-amber-100 text-amber-700" : m ? "bg-red-50 text-red-500" : "bg-cream-200 text-ink-400")}
                    title={st === "have" ? "Elinde var" : st === "low" ? "Miktar yetersiz olabilir" : "Eksik"}>
                    {st === "have" ? <Check size={14} /> : st === "low" ? <AlertTriangle size={12} /> : <Circle size={8} />}
                  </span>
                  <span className="flex-1 text-[15px]">
                    <span className="font-semibold capitalize">{i.name}</span>
                    {i.note && <span className="text-ink-500"> ({i.note})</span>}
                    {i.isOptional && <span className="ml-1.5 text-xs text-ink-400">isteğe bağlı</span>}
                    {i.isEssential && <span className="ml-1.5 text-xs font-semibold text-accent-600">ana malzeme</span>}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-ink-600">{q != null ? formatQuantity(q) : ""} {i.unit ? UNIT_LABELS[i.unit] : ""}</span>
                </li>
              );
            })}
          </ul>
          {m && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-leaf-300" />Elinde var</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" />Miktar az</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-300" />Eksik</span>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Hazırlanışı</h2>
          <ol className="mt-4 space-y-3">
            {r.steps.map((s, i) => {
              const isDone = done.has(i);
              return (
                <li key={i}>
                  <button onClick={() => setDone((d) => { const n = new Set(d); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                    className={cn("flex w-full gap-4 rounded-3xl border p-5 text-left transition", isDone ? "border-leaf-200 bg-leaf-50" : "border-cream-300 bg-white hover:border-forest-200")} aria-pressed={isDone}>
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold", isDone ? "bg-forest-700 text-white" : "bg-accent-50 text-accent-600")}>
                      {isDone ? <Check size={18} /> : i + 1}
                    </span>
                    <span className={cn("pt-1.5 text-[15px] leading-relaxed", isDone ? "text-ink-500 line-through decoration-ink-300" : "text-ink-800")}>{s}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-ink-400">İpucu: tamamladığın adıma dokunarak işaretleyebilirsin.</p>
          <div className="mt-8 rounded-3xl bg-cream-50 p-5 text-sm text-ink-600 ring-1 ring-cream-300">
            <p className="font-semibold text-ink-800">Besin değerleri</p>
            <p className="mt-1">Bu tarif için doğrulanmış bir besin değeri kaynağı bulunmadığından değer gösterilmiyor. Tahmini değerler yanıltıcı olabileceği için bilinçli olarak eklenmemiştir.</p>
          </div>
        </section>
      </div>
    </article>
  );
}

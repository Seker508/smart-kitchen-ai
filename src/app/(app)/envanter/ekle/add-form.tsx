"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/client";
import { cn } from "@/lib/cn";
import { INGREDIENT_CATEGORY_LABELS, STORAGE_AREAS, STORAGE_LABELS, UNIT_LABELS, UNITS } from "@/lib/constants";
import type { StorageArea, Unit } from "@/db/schema";

type CatalogItem = { id: number; name: string; categorySlug: string; defaultUnit: Unit; allergens: string[] };

const QUICK = ["yumurta", "süt", "domates", "patates", "kuru soğan", "yoğurt", "beyaz peynir", "un", "pirinç", "tavuk göğsü", "kıyma", "sivri biber"];

const defaultStorage = (cat: string): StorageArea =>
  ["sut-urunleri", "et-tavuk", "sebzeler", "meyveler"].includes(cat) ? "BUZDOLABI" : "MUTFAK_DOLABI";

export function AddIngredientForm() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [categorySlug, setCategorySlug] = useState("diger");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<Unit>("ADET");
  const [storage, setStorage] = useState<StorageArea>("BUZDOLABI");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected && selected.name === name) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await api<{ items: CatalogItem[] }>(`/api/catalog?q=${encodeURIComponent(name)}`, { signal: ctrl.signal });
        setSuggestions(r.items); setActiveIdx(-1);
        if (document.activeElement === nameRef.current) setShowSug(true);
      } catch { /* öneri alınamazsa form yine çalışır */ }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [name, selected]);

  function pick(item: CatalogItem) {
    setSelected(item); setName(item.name); setShowSug(false);
    setUnit(item.defaultUnit); setCategorySlug(item.categorySlug); setStorage(defaultStorage(item.categorySlug));
    setQuantity(["GRAM", "MILILITRE"].includes(item.defaultUnit) ? "500" : "1");
  }

  async function submit(again: boolean) {
    setLoading(true); setErrors({});
    try {
      const res = await api<{ message: string; item: { name: string } }>("/api/ingredients", {
        body: {
          ingredientId: selected?.name === name ? selected.id : null, name, categorySlug,
          quantity: Number(quantity.replace(",", ".")), unit, storage, expiresAt: expiresAt || null, note: note || null,
        },
      });
      toast(res.message);
      if (again) {
        setAdded((a) => [res.item.name, ...a]);
        setName(""); setSelected(null); setSuggestions([]); setQuantity("1"); setExpiresAt(""); setNote("");
        nameRef.current?.focus();
      } else {
        router.push("/envanter"); router.refresh();
      }
    } catch (e) {
      if (e instanceof ApiClientError) setErrors(e.fields ?? { _: e.message });
      else setErrors({ _: "Beklenmeyen bir hata oluştu." });
    } finally { setLoading(false); }
  }

  const inCatalog = !!selected && selected.name === name;

  return (
    <>
      <Link href="/envanter" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-forest-800"><ArrowLeft size={16} />Envantere dön</Link>
      <PageHeader title="Malzeme ekle" description="Listeden seçmek en doğrusu: katalogdaki ürünler tariflerle otomatik eşleşir. Aynı ürünü tekrar eklersen miktarı güncellenir." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form className="card space-y-5 p-6 sm:p-8" noValidate onSubmit={(e) => { e.preventDefault(); submit(false); }}>
          {errors._ && <Notice tone="danger">{errors._}</Notice>}
          <Field label="Malzeme adı" htmlFor="name" error={errors.name} hint={name.length > 1 ? (inCatalog ? `✓ Katalogda: ${INGREDIENT_CATEGORY_LABELS[selected!.categorySlug]}` : "Katalogda bulunamazsa kategoriyi sen seç.") : undefined}>
            <div className="relative">
              <Input ref={nameRef} id="name" autoComplete="off" placeholder="ör. domates, yoğurt, kırmızı mercimek" value={name} invalid={!!errors.name}
                role="combobox" aria-expanded={showSug && suggestions.length > 0} aria-controls="catalog-list" aria-autocomplete="list"
                onChange={(e) => { setName(e.target.value); setSuggestions([]); setShowSug(true); }}
                onFocus={() => setShowSug(true)} onBlur={() => setTimeout(() => { if (document.activeElement !== nameRef.current) setShowSug(false); }, 150)}
                onKeyDown={(e) => {
                  if (!showSug || !suggestions.length) return;
                  if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
                  else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx]); }
                  else if (e.key === "Escape") setShowSug(false);
                }} />
              {showSug && suggestions.length > 0 && !inCatalog && (
                <ul id="catalog-list" role="listbox" className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-cream-300 bg-white p-1.5 shadow-lift">
                  {suggestions.map((s, i) => (
                    <li key={s.id} role="option" aria-selected={i === activeIdx}>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}
                        className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm", i === activeIdx ? "bg-forest-50" : "hover:bg-cream-50")}>
                        <span className="font-semibold capitalize">{s.name}</span>
                        <span className="text-xs text-ink-500">{INGREDIENT_CATEGORY_LABELS[s.categorySlug]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>

          {!inCatalog && name.length > 1 && (
            <Field label="Kategori" htmlFor="cat">
              <Select id="cat" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
                {Object.entries(INGREDIENT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Miktar" htmlFor="qty" error={errors.quantity}>
              <Input id="qty" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} invalid={!!errors.quantity} />
            </Field>
            <Field label="Ölçü birimi" htmlFor="unit" error={errors.unit}>
              <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>{UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}</Select>
            </Field>
          </div>

          <fieldset>
            <legend className="label">Saklama alanı</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STORAGE_AREAS.map((s) => (
                <label key={s} className={cn("cursor-pointer rounded-2xl border px-3 py-2.5 text-center text-sm font-semibold transition", storage === s ? "border-forest-600 bg-forest-50 text-forest-800" : "border-cream-300 hover:border-forest-200")}>
                  <input type="radio" name="storage" value={s} checked={storage === s} onChange={() => setStorage(s)} className="sr-only" />
                  {STORAGE_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Son kullanma tarihi" htmlFor="exp" error={errors.expiresAt} hint="İsteğe bağlı — eklersen israfı azaltma sistemi bu ürünü takip eder.">
            <Input id="exp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
          <Field label="Açıklama" htmlFor="note" hint="İsteğe bağlı, ör. 'açılmış paket', 'organik'">
            <Input id="note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" loading={loading} onClick={() => submit(true)} icon={<Plus size={17} />}>Ekle ve devam et</Button>
            <Button type="submit" loading={loading} icon={<Check size={17} />}>Ekle</Button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="card p-5">
            <p className="font-display text-lg font-semibold">Hızlı seçim</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((n) => (
                <button key={n} type="button" onClick={async () => {
                  const r = await api<{ items: CatalogItem[] }>(`/api/catalog?q=${encodeURIComponent(n)}`).catch(() => null);
                  const hit = r?.items.find((x) => x.name === n);
                  if (hit) pick(hit); else setName(n);
                }} className="rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-sm font-medium capitalize transition hover:border-forest-200 hover:bg-forest-50">{n}</button>
              ))}
            </div>
          </div>
          <Link href="/fotograf" className="card flex items-center gap-4 p-5 transition hover:shadow-lift">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500 text-white"><Camera size={22} /></span>
            <span><b className="block">Fotoğrafla daha hızlı</b><span className="text-sm text-ink-500">Tüm rafı tek seferde algılat.</span></span>
          </Link>
          {added.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-ink-700">Bu oturumda eklenenler</p>
              <ul className="mt-2 space-y-1.5 text-sm">{added.map((a, i) => <li key={i} className="flex items-center gap-2 capitalize"><Check size={14} className="text-forest-600" />{a}</li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

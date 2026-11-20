"use client";
import { useCallback, useEffect, useState } from "react";
import { ArchiveRestore, Check, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/client";
import { cn } from "@/lib/cn";
import { UNIT_LABELS, UNITS } from "@/lib/constants";
import { formatQuantity } from "@/lib/units";
import type { ShoppingItem } from "@/lib/services/shopping";
import type { Unit } from "@/db/schema";

export function ShoppingView() {
  const toast = useToast();
  const [items, setItems] = useState<ShoppingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState<Unit>("ADET");
  const [adding, setAdding] = useState(false);
  const [fieldErr, setFieldErr] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setItems((await api<{ items: ShoppingItem[] }>("/api/shopping-list")).items); }
    catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true); setFieldErr(null);
    try {
      const r = await api<{ message: string }>("/api/shopping-list", { body: { name, quantity: qty ? Number(qty.replace(",", ".")) : null, unit: qty ? unit : null } });
      toast(r.message); setName(""); setQty(""); load();
    } catch (err) {
      setFieldErr(err instanceof ApiClientError ? Object.values(err.fields ?? {})[0] ?? err.message : "Eklenemedi.");
    } finally { setAdding(false); }
  }

  async function toggle(it: ShoppingItem) {
    setItems((s) => s && s.map((x) => (x.id === it.id ? { ...x, isPurchased: !x.isPurchased } : x)));
    try { await api(`/api/shopping-list/${it.id}`, { method: "PATCH", body: { isPurchased: !it.isPurchased } }); }
    catch (e) { toast((e as Error).message, "error"); load(); }
  }
  async function remove(it: ShoppingItem) {
    setItems((s) => s && s.filter((x) => x.id !== it.id));
    try { await api(`/api/shopping-list/${it.id}`, { method: "DELETE" }); }
    catch (e) { toast((e as Error).message, "error"); load(); }
  }
  async function action(a: "clear-purchased" | "move-to-inventory") {
    setActing(a);
    try { const r = await api<{ message: string }>("/api/shopping-list/actions", { body: { action: a } }); toast(r.message); load(); }
    catch (e) { toast((e as Error).message, "error"); } finally { setActing(null); }
  }

  const open = items?.filter((i) => !i.isPurchased) ?? [];
  const bought = items?.filter((i) => i.isPurchased) ?? [];

  const Row = ({ it }: { it: ShoppingItem }) => (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <button onClick={() => toggle(it)} aria-pressed={it.isPurchased} aria-label={it.isPurchased ? `${it.name} satın alınmadı olarak işaretle` : `${it.name} satın alındı olarak işaretle`}
        className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition", it.isPurchased ? "border-forest-600 bg-forest-600 text-white" : "border-cream-300 hover:border-forest-500")}>
        {it.isPurchased && <Check size={15} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold capitalize", it.isPurchased && "text-ink-400 line-through")}>{it.name}</p>
        {it.fromRecipes.length > 0 && <p className="truncate text-xs text-ink-500">Tarif: {it.fromRecipes.join(", ")}</p>}
      </div>
      {it.quantity != null && <span className="shrink-0 text-sm font-medium tabular-nums text-ink-600">{formatQuantity(it.quantity)} {it.unit ? UNIT_LABELS[it.unit] : ""}</span>}
      <button onClick={() => remove(it)} className="rounded-xl p-2 text-ink-300 hover:bg-red-50 hover:text-red-600" aria-label={`${it.name} sil`}><Trash2 size={16} /></button>
    </li>
  );

  return (
    <>
      <PageHeader eyebrow="Araçlar" title="Alışveriş listesi" description="Tariflerden eklenen eksikler ve kendi eklediklerin. Aynı ürünler otomatik birleştirilir." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <form onSubmit={add} className="card p-4" noValidate>
            <div className="grid gap-2 sm:grid-cols-[1fr_110px_150px_auto]">
              <Input aria-label="Ürün adı" placeholder="Ürün ekle, ör. süt" value={name} onChange={(e) => setName(e.target.value)} invalid={!!fieldErr} />
              <Input aria-label="Miktar" placeholder="Miktar" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
              <Select aria-label="Birim" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>{UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}</Select>
              <Button type="submit" loading={adding} icon={<Plus size={17} />}>Ekle</Button>
            </div>
            {fieldErr && <p className="mt-2 text-sm text-red-600" role="alert">{fieldErr}</p>}
          </form>

          {error ? <ErrorState message={error} onRetry={load} /> : items === null ? <SkeletonRows /> : items.length === 0 ? (
            <EmptyState icon={<ShoppingBasket size={26} />} title="Listen boş" description="Tarif sayfalarındaki 'Eksikleri alışveriş listesine ekle' butonuyla eksik malzemeleri buraya aktarabilirsin." action={<ButtonLink href="/tarifler" variant="outline">Tariflere göz at</ButtonLink>} />
          ) : (
            <>
              <section className="card overflow-hidden p-0">
                <h2 className="border-b border-cream-200 px-5 py-3.5 text-sm font-bold text-ink-700">Alınacaklar ({open.length})</h2>
                {open.length ? <ul className="divide-y divide-cream-200">{open.map((it) => <Row key={it.id} it={it} />)}</ul> : <p className="px-5 py-4 text-sm text-ink-500">Hepsi alındı! 🎉</p>}
              </section>
              {bought.length > 0 && (
                <section className="card overflow-hidden p-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 px-5 py-3">
                    <h2 className="text-sm font-bold text-ink-700">Satın alınanlar ({bought.length})</h2>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" loading={acting === "move-to-inventory"} onClick={() => action("move-to-inventory")} icon={<ArchiveRestore size={15} />}>Envantere aktar</Button>
                      <Button size="sm" variant="ghost" loading={acting === "clear-purchased"} onClick={() => action("clear-purchased")}>Temizle</Button>
                    </div>
                  </div>
                  <ul className="divide-y divide-cream-200">{bought.map((it) => <Row key={it.id} it={it} />)}</ul>
                </section>
              )}
            </>
          )}
        </div>
        <aside className="card h-fit p-5">
          <p className="font-display text-lg font-semibold">Nasıl çalışır?</p>
          <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
            <li>• Tarif detayında eksik ve miktarı yetersiz malzemeler tek tıkla eklenir.</li>
            <li>• Aynı ürün tekrar eklenirse miktarlar birim dönüştürülerek birleştirilir.</li>
            <li>• Aldıklarını işaretle, &quot;Envantere aktar&quot; ile mutfağına ekle.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

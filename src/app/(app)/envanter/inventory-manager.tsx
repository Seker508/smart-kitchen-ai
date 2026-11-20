"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Minus, Pencil, Plus, Refrigerator, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { INGREDIENT_CATEGORY_LABELS, STORAGE_AREAS, STORAGE_LABELS, UNIT_LABELS, UNITS } from "@/lib/constants";
import { expiryLabel, expiryStatus } from "@/lib/expiry";
import { formatQuantity } from "@/lib/units";
import type { InventoryRow } from "@/lib/services/inventory";
import type { StorageArea, Unit } from "@/db/schema";

type ListResponse = { items: InventoryRow[]; total: number; page: number; totalPages: number };

const SORTS = { expiry: "Son kullanma tarihine göre", name: "Ada göre (A-Z)", recent: "En son eklenen", quantity: "Miktara göre" } as const;

export function ExpiryChip({ date }: { date: string | null }) {
  const st = expiryStatus(date);
  if (st === "none") return <span className="chip bg-cream-200 text-ink-500">SKT yok</span>;
  const tone = { expired: "bg-red-50 text-red-700", urgent: "bg-accent-50 text-accent-700", soon: "bg-amber-50 text-amber-800", ok: "bg-leaf-50 text-forest-700", none: "" }[st];
  return <span className={cn("chip", tone)} title={date ?? undefined}>{expiryLabel(date)}</span>;
}

export function InventoryManager() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("");
  const [storage, setStorage] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("expiry");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [deleting, setDeleting] = useState<InventoryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const reqId = useRef(0);

  useEffect(() => { const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true); setError(null);
    const params = new URLSearchParams({ sort, page: String(page), pageSize: "15" });
    if (debouncedQ) params.set("q", debouncedQ);
    if (category) params.set("category", category);
    if (storage) params.set("storage", storage);
    try {
      const res = await api<ListResponse>(`/api/ingredients?${params}`);
      if (id === reqId.current) setData(res);
    } catch (e) {
      if (id === reqId.current) setError((e as Error).message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [debouncedQ, category, storage, sort, page]);

  useEffect(() => { load(); }, [load]);

  async function quickQty(item: InventoryRow, delta: number) {
    const next = Math.max(0.01, Math.round((item.quantity + delta) * 100) / 100);
    setData((d) => d && { ...d, items: d.items.map((i) => (i.id === item.id ? { ...i, quantity: next } : i)) });
    try { await api(`/api/ingredients/${item.id}`, { method: "PUT", body: { quantity: next } }); }
    catch (e) { toast((e as Error).message, "error"); load(); }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/ingredients/${deleting.id}`, { method: "DELETE" });
      toast(`${deleting.name} silindi`);
      setDeleting(null);
      load();
    } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
  }

  const filtersActive = !!(debouncedQ || category || storage);
  const step = (u: Unit) => (["GRAM", "MILILITRE"].includes(u) ? 50 : 1);

  return (
    <>
      <PageHeader eyebrow="Mutfak" title="Mutfak Envanterim" description="Buzdolabın, dondurucun ve dolaplarındaki tüm ürünler. Tarif önerileri bu listeye göre hesaplanır."
        actions={<><ButtonLink href="/fotograf" variant="outline" icon={<Camera size={17} />}>Fotoğrafla ekle</ButtonLink><ButtonLink href="/envanter/ekle" icon={<Plus size={17} />}>Malzeme ekle</ButtonLink></>} />

      <div className="card mb-5 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative col-span-2 md:col-span-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input aria-label="Ürün ara" placeholder="Ürün ara…" className="pl-11" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select aria-label="Kategori" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">Tüm kategoriler</option>
            {Object.entries(INGREDIENT_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select aria-label="Saklama alanı" value={storage} onChange={(e) => { setStorage(e.target.value); setPage(1); }}>
            <option value="">Tüm alanlar</option>
            {STORAGE_AREAS.map((s) => <option key={s} value={s}>{STORAGE_LABELS[s]}</option>)}
          </Select>
          <Select aria-label="Sıralama" className="col-span-2 md:col-span-1" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        {filtersActive && (
          <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-600" onClick={() => { setQ(""); setCategory(""); setStorage(""); }}>
            <X size={14} />Filtreleri temizle
          </button>
        )}
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : loading && !data ? <SkeletonRows n={6} /> : data && data.items.length === 0 ? (
        filtersActive
          ? <EmptyState icon={<Search size={24} />} title="Eşleşen ürün yok" description="Farklı bir arama ya da filtre deneyin." />
          : <EmptyState icon={<Refrigerator size={26} />} title="Envanterin boş" description="İlk malzemeni ekle ya da buzdolabının fotoğrafını yükleyerek ürünleri otomatik algılat."
            action={<div className="flex flex-wrap justify-center gap-2"><ButtonLink href="/envanter/ekle" icon={<Plus size={17} />}>Malzeme ekle</ButtonLink><ButtonLink href="/fotograf" variant="outline" icon={<Camera size={17} />}>Fotoğraf yükle</ButtonLink></div>} />
      ) : data && (
        <div className={cn("transition-opacity", loading && "opacity-60")}>
          <p className="mb-3 text-sm text-ink-500"><b className="text-ink-800">{data.total}</b> kayıt</p>
          {/* Masaüstü tablo */}
          <div className="card hidden overflow-hidden p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-50 text-xs font-bold uppercase tracking-wider text-ink-500">
                <tr><th className="px-5 py-3.5">Ürün</th><th className="px-3 py-3.5">Kategori</th><th className="px-3 py-3.5">Miktar</th><th className="px-3 py-3.5">Saklama</th><th className="px-3 py-3.5">Son kullanma</th><th className="px-5 py-3.5 text-right">İşlem</th></tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {data.items.map((i) => (
                  <tr key={i.id} className="transition hover:bg-cream-50/70">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold capitalize text-ink-900">{i.name}</p>
                      {i.note && <p className="max-w-[240px] truncate text-xs text-ink-500">{i.note}</p>}
                    </td>
                    <td className="px-3 py-3.5 text-ink-600">{i.categoryName}</td>
                    <td className="px-3 py-3.5">
                      <div className="inline-flex items-center gap-1 rounded-xl border border-cream-300 bg-white p-0.5">
                        <button className="rounded-lg p-1.5 text-ink-500 hover:bg-cream-100" aria-label={`${i.name} miktarını azalt`} onClick={() => quickQty(i, -step(i.unit))} disabled={i.quantity <= step(i.unit)}><Minus size={14} /></button>
                        <span className="min-w-[72px] text-center font-semibold tabular-nums">{formatQuantity(i.quantity)} <span className="font-normal text-ink-500">{UNIT_LABELS[i.unit]}</span></span>
                        <button className="rounded-lg p-1.5 text-ink-500 hover:bg-cream-100" aria-label={`${i.name} miktarını artır`} onClick={() => quickQty(i, step(i.unit))}><Plus size={14} /></button>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-600">{STORAGE_LABELS[i.storage]}</td>
                    <td className="px-3 py-3.5"><ExpiryChip date={i.expiresAt} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="rounded-xl p-2 text-ink-400 hover:bg-cream-100 hover:text-forest-700" aria-label={`${i.name} düzenle`} onClick={() => setEditing(i)}><Pencil size={16} /></button>
                      <button className="rounded-xl p-2 text-ink-400 hover:bg-red-50 hover:text-red-600" aria-label={`${i.name} sil`} onClick={() => setDeleting(i)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobil kartlar */}
          <ul className="space-y-3 md:hidden">
            {data.items.map((i) => (
              <li key={i.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize">{i.name}</p>
                    <p className="text-xs text-ink-500">{i.categoryName} · {STORAGE_LABELS[i.storage]}</p>
                  </div>
                  <ExpiryChip date={i.expiresAt} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 rounded-xl border border-cream-300 p-0.5">
                    <button className="rounded-lg p-2" aria-label="Azalt" onClick={() => quickQty(i, -step(i.unit))} disabled={i.quantity <= step(i.unit)}><Minus size={15} /></button>
                    <span className="min-w-[80px] text-center text-sm font-semibold">{formatQuantity(i.quantity)} {UNIT_LABELS[i.unit]}</span>
                    <button className="rounded-lg p-2" aria-label="Artır" onClick={() => quickQty(i, step(i.unit))}><Plus size={15} /></button>
                  </div>
                  <div>
                    <button className="rounded-xl p-2.5 text-ink-500" aria-label="Düzenle" onClick={() => setEditing(i)}><Pencil size={17} /></button>
                    <button className="rounded-xl p-2.5 text-red-500" aria-label="Sil" onClick={() => setDeleting(i)}><Trash2 size={17} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      {editing && <EditDialog item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy}
        title="Ürünü sil" message={<><b className="capitalize">{deleting?.name}</b> envanterinden silinecek. Bu işlem geri alınamaz.</>} />
    </>
  );
}

function EditDialog({ item, onClose, onSaved }: { item: InventoryRow; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ quantity: String(item.quantity), unit: item.unit, storage: item.storage, expiresAt: item.expiresAt ?? "", note: item.note ?? "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setErr({});
    try {
      await api(`/api/ingredients/${item.id}`, { method: "PUT", body: { quantity: Number(f.quantity.replace(",", ".")), unit: f.unit, storage: f.storage, expiresAt: f.expiresAt || null, note: f.note || null } });
      toast("Ürün güncellendi");
      onSaved();
    } catch (e: any) { setErr(e.fields ?? { _: e.message }); } finally { setBusy(false); }
  }
  return (
    <Dialog open onClose={onClose} title={`Düzenle: ${item.name}`} footer={<><Button variant="ghost" onClick={onClose}>Vazgeç</Button><Button onClick={save} loading={busy} icon={<Check size={16} />}>Kaydet</Button></>}>
      <div className="grid gap-4">
        {err._ && <p className="text-sm text-red-600">{err._}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Miktar" htmlFor="eq" error={err.quantity}><Input id="eq" inputMode="decimal" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></Field>
          <Field label="Birim" htmlFor="eu"><Select id="eu" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as Unit })}>{UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}</Select></Field>
        </div>
        <Field label="Saklama alanı" htmlFor="es"><Select id="es" value={f.storage} onChange={(e) => setF({ ...f, storage: e.target.value as StorageArea })}>{STORAGE_AREAS.map((s) => <option key={s} value={s}>{STORAGE_LABELS[s]}</option>)}</Select></Field>
        <Field label="Son kullanma tarihi" htmlFor="ee" error={err.expiresAt}><Input id="ee" type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>
        <Field label="Açıklama (isteğe bağlı)" htmlFor="en"><Input id="en" maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}

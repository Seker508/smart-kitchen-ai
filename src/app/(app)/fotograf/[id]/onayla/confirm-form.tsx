"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, CircleHelp, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { STORAGE_AREAS, STORAGE_LABELS, UNIT_LABELS, UNITS } from "@/lib/constants";
import type { StorageArea, Unit } from "@/db/schema";

type Init = { key: string; name: string; ingredientId: number | null; alternatives: string[]; confidence: number; uncertain: boolean; categorySlug: string; quantity: number | null; unit: Unit };
type Row = { key: string; selected: boolean; name: string; originalName: string; ingredientId: number | null; alternatives: string[]; confidence: number | null; uncertain: boolean; quantity: string; unit: Unit; storage: StorageArea; expiresAt: string };

const defaultQty = (u: Unit) => (u === "GRAM" ? "500" : u === "MILILITRE" ? "1000" : "1");
const storageFor = (cat: string): StorageArea => (["baharatlar", "tahillar", "bakliyat", "yaglar", "diger", "unlu-mamuller"].includes(cat) ? "MUTFAK_DOLABI" : "BUZDOLABI");

export function ConfirmForm({ analysisId, initial }: { analysisId: string; initial: Init[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(() => initial.map((d) => ({
    key: d.key, selected: !d.uncertain, name: d.name, originalName: d.name, ingredientId: d.ingredientId, alternatives: d.alternatives,
    confidence: d.confidence, uncertain: d.uncertain, quantity: d.quantity != null ? String(d.quantity) : defaultQty(d.unit), unit: d.unit,
    storage: storageFor(d.categorySlug), expiresAt: "",
  })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upd = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const selected = rows.filter((r) => r.selected);

  async function confirm() {
    setError(null);
    const bad = selected.find((r) => r.name.trim().length < 2 || !(Number(r.quantity.replace(",", ".")) > 0));
    if (bad) return setError(`"${bad.name || "adsız ürün"}" için geçerli bir ad ve miktar girin.`);
    setBusy(true);
    try {
      const res = await api<{ message: string }>(`/api/image-analysis/${analysisId}/confirm`, {
        body: {
          items: selected.map((r) => ({
            name: r.name.trim(), ingredientId: r.name === r.originalName ? r.ingredientId : null, quantity: Number(r.quantity.replace(",", ".")),
            unit: r.unit, storage: r.storage, expiresAt: r.expiresAt || null,
          })),
        },
      });
      toast(res.message);
      router.push("/envanter"); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      <Link href={`/fotograf/${analysisId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-forest-800"><ArrowLeft size={16} />Analiz sonucuna dön</Link>
      <PageHeader eyebrow="Son adım" title="Algılanan malzemeleri onayla" description="Ürün adlarını düzelt, yanlış olanları kaldır, eksikleri ekle. Yalnızca seçili ürünler envantere kaydedilir." />
      {error && <Notice tone="danger" className="mb-4">{error}</Notice>}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.key} className={cn("card p-4 transition sm:p-5", !r.selected && "opacity-70", r.uncertain && "border-amber-200")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="flex shrink-0 items-center gap-3 lg:w-[260px]">
                <input type="checkbox" checked={r.selected} onChange={(e) => upd(r.key, { selected: e.target.checked })} className="h-5 w-5 rounded-md accent-forest-700" aria-label={`${r.name} seç`} />
                <div className="min-w-0 flex-1">
                  <Input aria-label="Ürün adı" value={r.name} onChange={(e) => upd(r.key, { name: e.target.value, selected: true })} className="h-10 py-2 font-semibold capitalize" />
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    {r.confidence != null ? (
                      <span className={cn("chip", r.uncertain ? "bg-amber-50 text-amber-800" : "bg-leaf-50 text-forest-700")}>{r.uncertain && <CircleHelp size={11} />}Güven %{Math.round(r.confidence * 100)}</span>
                    ) : <span className="chip bg-cream-200 text-ink-600">Manuel eklendi</span>}
                    {r.alternatives.map((alt) => (
                      <button key={alt} type="button" onClick={() => upd(r.key, { name: alt, selected: true })} className="chip bg-white text-ink-600 ring-1 ring-cream-300 hover:bg-cream-50">{alt}?</button>
                    ))}
                  </div>
                </div>
              </label>
              <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                <Input aria-label="Miktar" inputMode="decimal" value={r.quantity} onChange={(e) => upd(r.key, { quantity: e.target.value })} className="h-10 py-2" />
                <Select aria-label="Birim" value={r.unit} onChange={(e) => upd(r.key, { unit: e.target.value as Unit })} className="h-10 py-2">{UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}</Select>
                <Select aria-label="Saklama alanı" value={r.storage} onChange={(e) => upd(r.key, { storage: e.target.value as StorageArea })} className="h-10 py-2">{STORAGE_AREAS.map((s) => <option key={s} value={s}>{STORAGE_LABELS[s]}</option>)}</Select>
                <Input aria-label="Son kullanma tarihi" type="date" value={r.expiresAt} onChange={(e) => upd(r.key, { expiresAt: e.target.value })} className="h-10 py-2" />
              </div>
              <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="self-end rounded-xl p-2.5 text-ink-400 hover:bg-red-50 hover:text-red-600 lg:self-center" aria-label={`${r.name} kaldır`}><Trash2 size={18} /></button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setRows((rs) => [...rs, { key: `new-${Date.now()}`, selected: true, name: "", originalName: "", ingredientId: null, alternatives: [], confidence: null, uncertain: false, quantity: "1", unit: "ADET", storage: "BUZDOLABI", expiresAt: "" }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-cream-300 py-4 text-sm font-semibold text-forest-700 transition hover:border-forest-200 hover:bg-forest-50">
        <Plus size={17} />Eksik ürün ekle
      </button>
      <div className="sticky bottom-20 z-10 mt-6 flex flex-col items-center justify-between gap-3 rounded-3xl bg-forest-800 p-4 text-white shadow-lift sm:flex-row lg:bottom-6">
        <p className="text-sm"><b>{selected.length}</b> ürün envantere eklenecek</p>
        <Button variant="accent" onClick={confirm} loading={busy} disabled={selected.length === 0} icon={<Check size={18} />}>Onayla ve envantere ekle</Button>
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EyeOff, Refrigerator, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, Notice, SkeletonCards } from "@/components/ui/states";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { SORT_LABELS, type SortKey } from "@/lib/recommend";
import type { RecommendationItem } from "@/lib/services/recipes";
import { RecipeCard } from "./recipe-card";

type Resp = { items: RecommendationItem[]; total: number; page: number; totalPages: number; excludedByPreferences: number; pantryEmpty: boolean };
export type CategoryTab = { key: string; label: string; categories?: string[] };

export function RecommendationsView({ eyebrow, title, description, tabs, initialSort = "onerilen" }: {
  eyebrow?: string; title: string; description: string; tabs: CategoryTab[]; initialSort?: SortKey;
}) {
  const [tab, setTab] = useState(tabs[0].key);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [includeConflicts, setIncludeConflicts] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const req = useRef(0);

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [tab, sort, onlyComplete, includeConflicts, maxMinutes]);

  const load = useCallback(async () => {
    const id = ++req.current;
    setLoading(true); setError(null);
    const t = tabs.find((x) => x.key === tab);
    try {
      const r = await api<Resp>("/api/recipes/recommend", {
        body: { categories: t?.categories, sort, onlyComplete, includeConflicts, maxMinutes: maxMinutes ? Number(maxMinutes) : undefined, q: dq || undefined, page, pageSize: 12 },
      });
      if (id === req.current) setData(r);
    } catch (e) { if (id === req.current) setError((e as Error).message); }
    finally { if (id === req.current) setLoading(false); }
  }, [tab, sort, onlyComplete, includeConflicts, maxMinutes, dq, page, tabs]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      {tabs.length > 1 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0" role="tablist" aria-label="Kategoriler">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition", tab === t.key ? "bg-forest-800 text-white shadow-sm" : "bg-white text-ink-600 ring-1 ring-cream-300 hover:bg-cream-50")}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input aria-label="Tarif veya malzeme ara" placeholder="Tarif ya da malzeme ara…" className="pl-11" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select aria-label="Sıralama" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {Object.entries(SORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select aria-label="Süre" value={maxMinutes} onChange={(e) => setMaxMinutes(e.target.value)}>
            <option value="">Her süre</option><option value="15">15 dk ve altı</option><option value="30">30 dk ve altı</option><option value="60">1 saat ve altı</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink-500"><SlidersHorizontal size={15} />Filtre:</span>
          <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-ink-700">
            <input type="checkbox" className="h-4 w-4 accent-forest-700" checked={onlyComplete} onChange={(e) => setOnlyComplete(e.target.checked)} />Sadece tüm malzemeleri olanlar
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-ink-700">
            <input type="checkbox" className="h-4 w-4 accent-forest-700" checked={includeConflicts} onChange={(e) => setIncludeConflicts(e.target.checked)} />Tercihlerime uymayanları da göster
          </label>
        </div>
      </div>

      {data?.pantryEmpty && (
        <Notice tone="info" className="mb-5" icon={<Refrigerator size={18} />} title="Envanterin boş">
          Uyumluluk yüzdeleri envanterine göre hesaplanır. <Link href="/envanter/ekle" className="link">Malzeme ekle</Link> ya da <Link href="/fotograf" className="link">fotoğraf yükle</Link>.
        </Notice>
      )}
      {!!data?.excludedByPreferences && !includeConflicts && (
        <p className="mb-4 flex items-center gap-2 text-sm text-ink-500"><EyeOff size={15} />Beslenme tercihlerin ve alerjilerin nedeniyle <b>{data.excludedByPreferences}</b> tarif gizlendi. <Link href="/profil" className="link">Tercihleri düzenle</Link></p>
      )}

      {error ? <ErrorState message={error} onRetry={load} /> : !data && loading ? <SkeletonCards n={8} /> : data && data.items.length === 0 ? (
        <EmptyState icon={<Search size={24} />} title="Bu filtrelere uygun tarif yok"
          description={onlyComplete ? "Tüm malzemelerine sahip olduğun bir tarif yok. Filtreyi kaldırıp en az eksiği olan tariflere bakabilirsin." : "Filtreleri değiştirmeyi dene."}
          action={onlyComplete ? <button className="link" onClick={() => setOnlyComplete(false)}>Filtreyi kaldır</button> : <ButtonLink href="/envanter/ekle" variant="outline">Malzeme ekle</ButtonLink>} />
      ) : data && (
        <div className={cn("transition-opacity", loading && "opacity-60")}>
          <p className="mb-3 text-sm text-ink-500"><b className="text-ink-800">{data.total}</b> tarif</p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.items.map((x) => <RecipeCard key={x.recipe.id} recipe={x.recipe} match={x.match} isFavorite={x.isFavorite} />)}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>
      )}
    </>
  );
}

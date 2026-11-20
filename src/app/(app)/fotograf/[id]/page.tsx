import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleHelp, ListChecks, PencilLine, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/states";
import { requirePageUser } from "@/lib/auth/session";
import { getAnalysis } from "@/lib/services/analysis";
import { INGREDIENT_CATEGORY_LABELS, UNIT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Yapay Zekâ Görüntü Analizi" };
export const dynamic = "force-dynamic";

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const a = await getAnalysis(user.id, id).catch(() => null);
  if (!a) notFound();
  const sure = a.detected.filter((d) => !d.uncertain);
  const unsure = a.detected.filter((d) => d.uncertain);

  return (
    <>
      <Link href="/fotograf" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-forest-800"><ArrowLeft size={16} />Yeni fotoğraf</Link>
      <PageHeader eyebrow="Yapay zekâ görüntü analizi" title="Analiz sonucu"
        description={a.summary ?? undefined}
        actions={a.status === "COMPLETED" && a.detected.length > 0 ? <ButtonLink href={`/fotograf/${a.id}/onayla`} variant="accent" icon={<ListChecks size={18} />}>Gözden geçir ve onayla</ButtonLink> : undefined} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="card overflow-hidden p-0 lg:sticky lg:top-8 lg:self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/image-analysis/${a.id}/image`} alt="Analiz edilen fotoğraf" className="max-h-[520px] w-full bg-ink-900 object-contain" />
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-xs text-ink-500">
            <span>{a.fileName} · {(a.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
            {a.model && <span>Model: <b className="text-ink-700">{a.provider}</b> / {a.model}</span>}
          </div>
        </div>

        <div>
          {a.status === "FAILED" && (
            <Notice tone="danger" icon={<AlertTriangle size={18} />} title="Analiz tamamlanamadı">
              {a.error}
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href="/fotograf" size="sm" variant="outline" icon={<RotateCcw size={15} />}>Tekrar dene</ButtonLink>
                <ButtonLink href="/envanter/ekle" size="sm" icon={<PencilLine size={15} />}>Manuel ekle</ButtonLink>
              </div>
            </Notice>
          )}
          {a.status === "CONFIRMED" && <Notice tone="success" icon={<CheckCircle2 size={18} />} title="Bu analiz onaylandı" className="mb-5">Ürünler envanterine eklendi. <Link href="/envanter" className="link">Envantere git</Link></Notice>}

          {a.status !== "FAILED" && a.detected.length === 0 && (
            <EmptyState icon={<CircleHelp size={24} />} title="Fotoğrafta gıda ürünü bulunamadı" description="Daha net ya da daha yakından çekilmiş bir fotoğraf deneyebilir veya ürünleri manuel ekleyebilirsin."
              action={<div className="flex gap-2"><ButtonLink href="/fotograf" variant="outline">Yeni fotoğraf</ButtonLink><ButtonLink href="/envanter/ekle">Manuel ekle</ButtonLink></div>} />
          )}

          {sure.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><CheckCircle2 size={20} className="text-forest-600" />Algılanan ürünler <span className="text-base font-normal text-ink-400">({sure.length})</span></h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {sure.map((d, i) => (
                  <li key={d.id} className="card animate-fade-up p-4" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold capitalize">{d.name}</p>
                        <p className="text-xs text-ink-500">{INGREDIENT_CATEGORY_LABELS[d.categorySlug] ?? d.categorySlug}{!d.matchedIngredientId && " · katalog dışı"}</p>
                      </div>
                      <span className="text-sm font-bold text-forest-600">%{Math.round(d.confidence * 100)}</span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-cream-200" role="progressbar" aria-valuenow={Math.round(d.confidence * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Güven skoru">
                      <div className="h-full rounded-full bg-forest-500" style={{ width: `${d.confidence * 100}%` }} />
                    </div>
                    {d.estimatedQuantity != null && <p className="mt-2 text-xs text-ink-500">Tahmini miktar: {d.estimatedQuantity} {d.estimatedUnit ? UNIT_LABELS[d.estimatedUnit] : ""}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {unsure.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-semibold"><CircleHelp size={20} className="text-amber-600" />Emin olunamayanlar</h2>
              <p className="mb-3 text-sm text-ink-500">Bu ürünler kesin olarak tanımlanmadı. Onay ekranında varsayılan olarak seçili gelmez; doğruysa seçebilir ya da adını düzeltebilirsin.</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {unsure.map((d) => (
                  <li key={d.id} className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold capitalize">{d.name}?</p>
                      <span className="text-sm font-bold text-amber-700">%{Math.round(d.confidence * 100)}</span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-amber-100"><div className={cn("h-full rounded-full bg-amber-400")} style={{ width: `${d.confidence * 100}%` }} /></div>
                    {d.alternatives.length > 0 && <p className="mt-2 text-xs text-amber-900">Olası: {d.alternatives.join(", ")}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

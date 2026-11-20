"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Clock, ImagePlus, Loader2, ScanSearch, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/states";
import { api, ApiClientError } from "@/lib/client";
import { cn } from "@/lib/cn";

const MAX_MB = 8;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
type Recent = { id: string; status: string; fileName: string; createdAt: string; summary: string | null };
type Ai = { configured: boolean; provider?: string; visionModel?: string };

const STATUS: Record<string, { t: string; c: string }> = {
  COMPLETED: { t: "Onay bekliyor", c: "bg-amber-50 text-amber-800" },
  CONFIRMED: { t: "Envantere eklendi", c: "bg-leaf-100 text-forest-800" },
  FAILED: { t: "Başarısız", c: "bg-red-50 text-red-700" },
  PROCESSING: { t: "İşleniyor", c: "bg-cream-200 text-ink-600" },
};

export function UploadView({ ai, recent }: { ai: Ai; recent: Recent[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(!ai.configured);
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(f: File | undefined | null) {
    setError(null);
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return setError("Yalnızca JPG, JPEG, PNG ve WEBP dosyaları desteklenir.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Dosya boyutu en fazla ${MAX_MB} MB olabilir.`);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function analyze() {
    if (!file) return;
    setError(null); setStage(1);
    const t1 = setTimeout(() => setStage(2), 900);
    const t2 = setTimeout(() => setStage(3), 4500);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api<{ analysis: { id: string } }>("/api/image-analysis", { form: fd });
      router.push(`/fotograf/${r.analysis.id}`);
    } catch (e) {
      setStage(0);
      if (e instanceof ApiClientError && e.code === "AI_NOT_CONFIGURED") setNotConfigured(true);
      setError((e as Error).message);
    } finally { clearTimeout(t1); clearTimeout(t2); }
  }

  const steps = ["Fotoğraf güvenli şekilde yükleniyor", "Yapay zekâ görseli inceliyor", "Ürünler katalogla eşleştiriliyor"];

  return (
    <>
      <PageHeader eyebrow="Yapay zekâ" title="Fotoğrafla ürün tanıma" description="Buzdolabının, mutfak dolabının ya da tezgâhın fotoğrafını yükle. Algılanan ürünleri gözden geçirip onayladıktan sonra envantere eklenir." />

      {notConfigured && (
        <Notice tone="warn" className="mb-6" icon={<AlertTriangle size={18} />} title="Görsel analiz şu an kullanılamıyor">
          Sunucuda bir yapay zekâ API anahtarı tanımlı değil (OPENAI_API_KEY, GEMINI_API_KEY veya ANTHROPIC_API_KEY). Bu özellik taklit edilmez; bunun yerine malzemelerini manuel ekleyebilirsin.
          <div className="mt-3"><ButtonLink href="/envanter/ekle" size="sm" variant="outline">Manuel malzeme ekle</ButtonLink></div>
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card p-5 sm:p-7">
          {!preview ? (
            <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files?.[0]); }}
              className={cn("flex min-h-[340px] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition",
                drag ? "border-accent-500 bg-accent-50" : "border-cream-300 bg-cream-50")}>
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-forest-700 shadow-card"><ImagePlus size={30} /></span>
              <p className="mt-5 font-display text-xl font-semibold">Fotoğrafı buraya sürükle</p>
              <p className="mt-1 text-sm text-ink-500">ya da cihazından seç · JPG, PNG, WEBP · en fazla {MAX_MB} MB</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button onClick={() => input.current?.click()} icon={<Upload size={17} />}>Dosya seç</Button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-cream-300 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest-800 hover:bg-cream-50 md:hidden">
                  <Camera size={17} />Kamerayı aç
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
                </label>
              </div>
              <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} aria-label="Fotoğraf dosyası seç" />
            </div>
          ) : (
            <div>
              <div className="relative overflow-hidden rounded-3xl bg-ink-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Yüklenecek fotoğraf önizlemesi" className={cn("max-h-[460px] w-full object-contain transition", stage > 0 && "opacity-60")} />
                {stage > 0 && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 animate-[scan_2s_ease-in-out_infinite] border-b-2 border-accent-400 bg-accent-400/10" />}
                {stage === 0 && (
                  <button onClick={() => { setFile(null); setPreview(null); }} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-ink-700 shadow" aria-label="Fotoğrafı kaldır"><X size={18} /></button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="truncate text-sm text-ink-500">{file?.name} · {((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB</p>
                <Button variant="accent" size="lg" onClick={analyze} loading={stage > 0} disabled={notConfigured} icon={<ScanSearch size={18} />}>
                  {stage > 0 ? "Analiz ediliyor…" : "Ürünleri algıla"}
                </Button>
              </div>
              {stage > 0 && (
                <ol className="mt-5 space-y-2.5" aria-live="polite">
                  {steps.map((s, i) => (
                    <li key={s} className={cn("flex items-center gap-3 text-sm font-medium", stage > i + 1 ? "text-forest-700" : stage === i + 1 ? "text-ink-900" : "text-ink-400")}>
                      {stage > i + 1 ? <CheckCircle2 size={18} /> : stage === i + 1 ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}{s}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
          {error && <Notice tone="danger" className="mt-5">{error}{!notConfigured && <> — dilersen <Link href="/envanter/ekle" className="link">manuel ekleyebilirsin</Link>.</>}</Notice>}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <p className="font-display text-lg font-semibold">İyi sonuç için ipuçları</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
              {["Rafları iyi aydınlatılmış ve net çek.", "Ürünlerin etiketleri görünür olsun.", "Çok kalabalık rafları birkaç fotoğrafa böl.", "Emin olunamayan ürünler ayrıca işaretlenir — onaylamadan eklenmez."].map((t) => (
                <li key={t} className="flex gap-2.5"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-forest-600" />{t}</li>
              ))}
            </ul>
            {ai.configured && <p className="mt-4 rounded-xl bg-cream-50 px-3 py-2 text-xs text-ink-500">Model: <b>{ai.provider}</b> · {ai.visionModel}</p>}
          </div>
          <div className="card p-5">
            <p className="font-display text-lg font-semibold">Son analizler</p>
            {recent.length === 0 ? <p className="mt-2 text-sm text-ink-500">Henüz analiz yok.</p> : (
              <ul className="mt-3 divide-y divide-cream-200">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link href={`/fotograf/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80">
                      <span className="min-w-0"><span className="block truncate text-sm font-semibold">{r.fileName}</span><span className="text-xs text-ink-500">{new Date(r.createdAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</span></span>
                      <span className={cn("chip shrink-0", STATUS[r.status]?.c)}>{STATUS[r.status]?.t}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
      <style>{`@keyframes scan{0%{transform:translateY(-100%)}50%{transform:translateY(200%)}100%{transform:translateY(-100%)}}`}</style>
    </>
  );
}

import type { Unit } from "@/db/schema";

type Dim = "mass" | "volume" | "count" | "other";

const MASS: Partial<Record<Unit, number>> = { GRAM: 1, KILOGRAM: 1000 };
// Türk mutfağında yaygın kabul gören ölçüler (ml)
const VOLUME: Partial<Record<Unit, number>> = {
  MILILITRE: 1, LITRE: 1000, SU_BARDAGI: 200, CAY_BARDAGI: 100, YEMEK_KASIGI: 15, TATLI_KASIGI: 10, CAY_KASIGI: 5,
};

/**
 * Yaklaşık yoğunluklar (g/ml). Kütle ↔ hacim dönüşümü yalnızca bu listedeki malzemeler için yapılır;
 * diğerlerinde miktar karşılaştırması "bilinmiyor" olarak raporlanır (tahmin yapılmaz).
 */
export const DENSITY_G_PER_ML: Record<string, number> = {
  un: 0.6, "toz-seker": 0.85, "pudra-sekeri": 0.6, pirinc: 0.9, "pilavlik-bulgur": 0.8, "koftelik-bulgur": 0.75,
  "kirmizi-mercimek": 0.85, "yesil-mercimek": 0.85, nohut: 0.8, "kuru-fasulye": 0.8, irmik: 0.75,
  "misir-unu": 0.65, "pirinc-unu": 0.65, "misir-nisastasi": 0.6, "yulaf-ezmesi": 0.4, tuz: 1.2,
  yogurt: 1.05, "tereyagi": 0.95, "domates-salcasi": 1.1, "biber-salcasi": 1.1, sut: 1.03, krema: 1.0,
  "sivi-yag": 0.92, zeytinyagi: 0.92, bal: 1.4, tahin: 1.05, kakao: 0.45, "tel-sehriye": 0.4, "arpa-sehriye": 0.7,
  "nar-eksisi": 1.3, sirke: 1.0, ceviz: 0.5, "toz-badem": 0.45, tarhana: 0.6, "beyaz-peynir": 0.6, "kasar-peyniri": 0.45,
};

export function unitDimension(u: Unit): Dim {
  if (u in MASS) return "mass";
  if (u in VOLUME) return "volume";
  if (u === "ADET") return "count";
  return "other";
}

export interface ConvertCtx {
  slug?: string;
  gramsPerPiece?: number | null;
}

function toGrams(q: number, u: Unit, ctx: ConvertCtx): number | null {
  if (MASS[u]) return q * MASS[u]!;
  if (VOLUME[u] && ctx.slug && DENSITY_G_PER_ML[ctx.slug]) return q * VOLUME[u]! * DENSITY_G_PER_ML[ctx.slug];
  if (u === "ADET" && ctx.gramsPerPiece) return q * ctx.gramsPerPiece;
  return null;
}

/**
 * Bir miktarı hedef birime dönüştürür. Güvenilir dönüşüm yoksa null döner.
 */
export function convert(q: number, from: Unit, to: Unit, ctx: ConvertCtx = {}): number | null {
  if (from === to) return q;
  const df = unitDimension(from), dt = unitDimension(to);
  if (df === "volume" && dt === "volume") return (q * VOLUME[from]!) / VOLUME[to]!;
  if (df === "mass" && dt === "mass") return (q * MASS[from]!) / MASS[to]!;
  const g = toGrams(q, from, ctx);
  if (g == null) return null;
  if (dt === "mass") return g / MASS[to]!;
  if (dt === "volume" && ctx.slug && DENSITY_G_PER_ML[ctx.slug]) return g / DENSITY_G_PER_ML[ctx.slug] / VOLUME[to]!;
  if (to === "ADET" && ctx.gramsPerPiece) return g / ctx.gramsPerPiece;
  return null;
}

/** Görüntüleme için miktar biçimlendirme: 0.5 → "½", 1.25 → "1¼" */
export function formatQuantity(q: number | null | undefined): string {
  if (q == null || Number.isNaN(q)) return "";
  const whole = Math.floor(q + 1e-9);
  const frac = q - whole;
  const fracs: [number, string][] = [[0.25, "¼"], [0.33, "⅓"], [0.5, "½"], [0.66, "⅔"], [0.75, "¾"]];
  for (const [v, sym] of fracs) if (Math.abs(frac - v) < 0.04) return whole ? `${whole}${sym}` : sym;
  if (frac < 0.04) return String(whole);
  return q >= 10 ? String(Math.round(q)) : (Math.round(q * 10) / 10).toLocaleString("tr-TR");
}

export function scaleQuantity(q: number | null, fromServings: number, toServings: number): number | null {
  if (q == null) return null;
  if (fromServings <= 0) return q;
  return (q * toServings) / fromServings;
}

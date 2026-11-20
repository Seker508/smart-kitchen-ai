/**
 * Fotoğraftan gıda ürünü tanıma. Görsel, yapılandırılmış çıktı isteyen bir istemle çok kipli (multimodal)
 * modele gönderilir; dönen sonuç doğrulanır, katalogla eşleştirilir ve güven skoruna göre işaretlenir.
 */
import { z } from "zod";
import type { Unit } from "@/db/schema";
import { INGREDIENT_CATEGORY_SLUGS, UNITS } from "../constants";
import { resolveIngredient } from "../services/catalog";
import { extractJson, generate } from "./provider";

export const UNCERTAIN_THRESHOLD = 0.6; // altı "emin değil" olarak işaretlenir
export const DISCARD_THRESHOLD = 0.25; // altı hiç gösterilmez

const SYSTEM = `Sen bir mutfak envanteri asistanısın. Görevin, kullanıcının yüklediği fotoğraftaki (buzdolabı, mutfak dolabı, tezgâh) GIDA ürünlerini belirlemektir.
Kurallar:
- Yalnızca fotoğrafta gerçekten görebildiğin gıda ürünlerini listele. Tahmin yürüterek görünmeyen ürün ekleme.
- Gıda olmayan nesneleri (kap, raf, tabak, dolap) listeleme.
- Ürün adlarını Türkçe, tekil ve sade yaz (ör. "yumurta", "domates", "sivri biber", "beyaz peynir", "yoğurt").
- Paketli ürünlerde etiketi okuyabiliyorsan ürün türünü yaz (marka değil).
- confidence 0 ile 1 arasında gerçekçi bir değer olmalı. Emin değilsen düşük değer ver ve "alternatives" alanına olası diğer ürünleri yaz.
- Emin olmadığın ürünü kesin bir tanımlama gibi sunma: uncertain=true yap.
- Miktarı yalnızca açıkça sayılabiliyorsa tahmin et (ör. 6 yumurta). Aksi halde estimatedQuantity null olsun.
- category şu değerlerden biri olmalı: ${INGREDIENT_CATEGORY_SLUGS.join(", ")}.
- unit şu değerlerden biri ya da null olmalı: ${UNITS.join(", ")}.`;

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "items"],
  properties: {
    summary: { type: "string", description: "Fotoğrafın kısa Türkçe açıklaması" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "confidence", "uncertain", "alternatives", "estimatedQuantity", "unit"],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: INGREDIENT_CATEGORY_SLUGS },
          confidence: { type: "number" },
          uncertain: { type: "boolean" },
          alternatives: { type: "array", items: { type: "string" } },
          estimatedQuantity: { type: ["number", "null"] },
          unit: { type: ["string", "null"], enum: [...UNITS, null] },
        },
      },
    },
  },
};

const responseSchema = z.object({
  summary: z.string().catch(""),
  items: z.array(z.object({
    name: z.string().min(1).max(80),
    category: z.string().catch("diger"),
    confidence: z.coerce.number().catch(0.5),
    uncertain: z.boolean().catch(false),
    alternatives: z.array(z.string().max(80)).max(5).catch([]),
    estimatedQuantity: z.number().positive().max(1000).nullable().catch(null),
    unit: z.string().nullable().catch(null),
  }).passthrough()).max(60).catch([]),
});

export interface Detection {
  name: string;
  matchedIngredientId: number | null;
  categorySlug: string;
  confidence: number;
  uncertain: boolean;
  alternatives: string[];
  estimatedQuantity: number | null;
  estimatedUnit: Unit | null;
}

/** Model çıktısını doğrular, katalogla eşleştirir, tekrarları birleştirir ve düşük güvenlileri işaretler. */
export async function normalizeDetections(raw: unknown): Promise<{ summary: string; items: Detection[] }> {
  const parsed = responseSchema.parse(raw);
  const out = new Map<string, Detection>();
  for (const it of parsed.items) {
    const confidence = Math.max(0, Math.min(1, it.confidence > 1 ? it.confidence / 100 : it.confidence));
    if (confidence < DISCARD_THRESHOLD) continue;
    const cat = await resolveIngredient(it.name);
    const name = cat?.name ?? it.name.trim().toLocaleLowerCase("tr-TR");
    const unit = it.unit && (UNITS as string[]).includes(it.unit) ? (it.unit as Unit) : null;
    const det: Detection = {
      name,
      matchedIngredientId: cat?.id ?? null,
      categorySlug: cat?.categorySlug ?? (INGREDIENT_CATEGORY_SLUGS.includes(it.category) ? it.category : "diger"),
      confidence: Math.round(confidence * 100) / 100,
      uncertain: it.uncertain || confidence < UNCERTAIN_THRESHOLD,
      alternatives: [...new Set(it.alternatives.map((a) => a.trim().toLocaleLowerCase("tr-TR")).filter((a) => a && a !== name))].slice(0, 3),
      estimatedQuantity: it.estimatedQuantity ?? null,
      estimatedUnit: it.estimatedQuantity != null ? unit ?? (cat?.defaultUnit as Unit | undefined) ?? "ADET" : null,
    };
    const prev = out.get(name);
    if (!prev || prev.confidence < det.confidence) out.set(name, det);
  }
  const items = [...out.values()].sort((a, b) => b.confidence - a.confidence);
  return { summary: parsed.summary.slice(0, 600), items };
}

export async function detectIngredients(image: { base64: string; mimeType: string }) {
  const { text, provider, model } = await generate({
    kind: "vision",
    system: SYSTEM,
    messages: [{ role: "user", content: "Bu fotoğraftaki gıda ürünlerini JSON olarak listele." }],
    image,
    jsonSchema: { name: "food_detection", schema: JSON_SCHEMA },
    maxTokens: 2000,
  });
  const result = await normalizeDetections(extractJson(text));
  return { ...result, provider, model };
}

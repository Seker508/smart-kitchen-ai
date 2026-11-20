import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { imageAnalyses, imageDetectedIngredients, type StorageArea, type Unit } from "@/db/schema";
import { ApiError, notFound } from "../api";
import { AiNotConfiguredError, AiProviderError, getAiConfig } from "../ai/provider";
import { detectIngredients } from "../ai/vision";
import { saveUpload } from "../upload";
import { addIngredient } from "./inventory";

export async function createAnalysis(userId: string, file: { buffer: Buffer; mimeType: string; originalName: string }) {
  if (!getAiConfig()) throw new ApiError(503, new AiNotConfiguredError().message, "AI_NOT_CONFIGURED");
  const [a] = await db.insert(imageAnalyses).values({
    userId, fileName: file.originalName, mimeType: file.mimeType, sizeBytes: file.buffer.length,
  }).returning();
  await saveUpload(userId, a.id, file.mimeType, file.buffer);

  try {
    const result = await detectIngredients({ base64: file.buffer.toString("base64"), mimeType: file.mimeType });
    await db.transaction(async (tx) => {
      if (result.items.length) {
        await tx.insert(imageDetectedIngredients).values(result.items.map((d) => ({
          analysisId: a.id, name: d.name, matchedIngredientId: d.matchedIngredientId, categorySlug: d.categorySlug,
          confidence: d.confidence, alternatives: d.alternatives, uncertain: d.uncertain,
          estimatedQuantity: d.estimatedQuantity == null ? null : String(d.estimatedQuantity), estimatedUnit: d.estimatedUnit,
        })));
      }
      await tx.update(imageAnalyses).set({ status: "COMPLETED", provider: result.provider, model: result.model, summary: result.summary })
        .where(eq(imageAnalyses.id, a.id));
    });
  } catch (e) {
    const msg = e instanceof AiProviderError ? e.message : "Görsel analiz sırasında beklenmeyen bir hata oluştu.";
    if (!(e instanceof AiProviderError)) console.error("[analysis]", e instanceof Error ? e.message : e);
    await db.update(imageAnalyses).set({ status: "FAILED", error: msg.slice(0, 300) }).where(eq(imageAnalyses.id, a.id));
  }
  return getAnalysis(userId, a.id);
}

export async function getAnalysis(userId: string, id: string) {
  const a = await db.query.imageAnalyses.findFirst({
    where: and(eq(imageAnalyses.id, id), eq(imageAnalyses.userId, userId)),
    with: { detected: true },
  });
  if (!a) throw notFound("Analiz");
  return {
    id: a.id, status: a.status, fileName: a.fileName, mimeType: a.mimeType, sizeBytes: a.sizeBytes, provider: a.provider,
    model: a.model, summary: a.summary, error: a.error, createdAt: a.createdAt,
    detected: a.detected.sort((x, y) => y.confidence - x.confidence).map((d) => ({
      id: d.id, name: d.name, matchedIngredientId: d.matchedIngredientId, categorySlug: d.categorySlug,
      confidence: d.confidence, alternatives: d.alternatives, uncertain: d.uncertain,
      estimatedQuantity: d.estimatedQuantity == null ? null : Number(d.estimatedQuantity), estimatedUnit: d.estimatedUnit,
    })),
  };
}
export type AnalysisDetail = Awaited<ReturnType<typeof getAnalysis>>;

export async function listAnalyses(userId: string, limit = 10) {
  return db.select({
    id: imageAnalyses.id, status: imageAnalyses.status, fileName: imageAnalyses.fileName, createdAt: imageAnalyses.createdAt, summary: imageAnalyses.summary,
  }).from(imageAnalyses).where(eq(imageAnalyses.userId, userId)).orderBy(desc(imageAnalyses.createdAt)).limit(limit);
}

export async function confirmAnalysis(
  userId: string, id: string,
  items: { name: string; ingredientId?: number | null; quantity: number; unit: Unit; storage: StorageArea; expiresAt?: string | null }[],
) {
  const a = await getAnalysis(userId, id);
  if (a.status === "CONFIRMED") throw new ApiError(409, "Bu analiz zaten onaylandı.", "ALREADY_CONFIRMED");
  if (a.status !== "COMPLETED") throw new ApiError(400, "Yalnızca tamamlanmış analizler onaylanabilir.", "NOT_COMPLETED");
  const results = [];
  for (const it of items) {
    results.push(await addIngredient(userId, { ...it, storage: it.storage }, "IMAGE"));
  }
  await db.update(imageAnalyses).set({ status: "CONFIRMED" }).where(and(eq(imageAnalyses.id, id), eq(imageAnalyses.userId, userId)));
  return { added: results.filter((r) => !r.merged).length, merged: results.filter((r) => r.merged).length };
}

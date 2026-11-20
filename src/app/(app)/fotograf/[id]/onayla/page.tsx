import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getAnalysis } from "@/lib/services/analysis";
import { loadCatalog } from "@/lib/services/catalog";
import { ConfirmForm } from "./confirm-form";

export const metadata: Metadata = { title: "Algılanan Malzemeleri Onayla" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const a = await getAnalysis(user.id, id).catch(() => null);
  if (!a) notFound();
  if (a.status !== "COMPLETED") redirect(`/fotograf/${id}`);
  const { list } = await loadCatalog();
  const units = new Map(list.map((c) => [c.id, c.defaultUnit]));
  const rows = a.detected.map((d) => ({
    key: d.id, name: d.name, ingredientId: d.matchedIngredientId, alternatives: d.alternatives, confidence: d.confidence,
    uncertain: d.uncertain, categorySlug: d.categorySlug,
    quantity: d.estimatedQuantity ?? null, unit: d.estimatedUnit ?? (d.matchedIngredientId ? units.get(d.matchedIngredientId) ?? "ADET" : "ADET"),
  }));
  return <ConfirmForm analysisId={a.id} initial={rows} />;
}

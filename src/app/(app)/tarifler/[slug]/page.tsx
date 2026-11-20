import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getRecipeDetail } from "@/lib/services/recipes";
import { RecipeDetailView } from "./recipe-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await getRecipeDetail((await params).slug).catch(() => null);
  return r ? { title: r.title, description: r.description } : { title: "Tarif bulunamadı" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requirePageUser();
  const recipe = await getRecipeDetail((await params).slug, user.id).catch(() => null);
  if (!recipe) notFound();
  return <RecipeDetailView recipe={JSON.parse(JSON.stringify(recipe))} />;
}

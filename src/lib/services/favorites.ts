import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { notFound } from "../api";
import { aggregatePantry, matchRecipe } from "../recommend";
import { getPantry } from "./inventory";
import { getPreferences, loadAllRecipes, recipeExists, stripIngredients, summarizeMatch, toMatchPrefs } from "./recipes";

export async function addFavorite(userId: string, recipeId: number) {
  if (!(await recipeExists(recipeId))) throw notFound("Tarif");
  await db.insert(favorites).values({ userId, recipeId }).onConflictDoNothing();
}

export async function removeFavorite(userId: string, recipeId: number) {
  const res = await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId))).returning();
  if (!res.length) throw notFound("Favori");
}

export async function listFavorites(userId: string) {
  const [rows, all, pantry, prefs] = await Promise.all([
    db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt)),
    loadAllRecipes(), getPantry(userId), getPreferences(userId),
  ]);
  const byId = new Map(all.map((r) => [r.id, r]));
  const agg = aggregatePantry(pantry);
  return rows.flatMap((f) => {
    const r = byId.get(f.recipeId);
    if (!r) return [];
    return [{ recipe: stripIngredients(r), match: summarizeMatch(matchRecipe(r, agg, toMatchPrefs(prefs))), isFavorite: true, addedAt: f.createdAt }];
  });
}

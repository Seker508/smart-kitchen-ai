import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { favorites, ingredients, recipeCategories, recipeIngredients, recipes, userPreferences } from "@/db/schema";
import { notFound } from "../api";
import {
  aggregatePantry, matchRecipe, recommend, type MatchPreferences, type MatchRecipe, type RecipeMatch, type SortKey,
} from "../recommend";
import { foldKey } from "../text";
import { getPantry } from "./inventory";

export interface RecipeCard extends MatchRecipe {
  description: string;
  emoji: string;
  imageUrl: string | null;
  categoryName: string;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: "KOLAY" | "ORTA" | "ZOR";
}

export type MatchSummary = Pick<RecipeMatch,
  "compatibility" | "haveCount" | "requiredCount" | "readiness" | "missingEssential" | "expiringUsed" | "insufficientCount" | "dietaryConflicts" | "allergenConflicts"> & {
  missing: string[];
};

export function summarizeMatch(m: RecipeMatch): MatchSummary {
  return {
    compatibility: m.compatibility, haveCount: m.haveCount, requiredCount: m.requiredCount, readiness: m.readiness,
    missingEssential: m.missingEssential, expiringUsed: m.expiringUsed, insufficientCount: m.insufficientCount,
    dietaryConflicts: m.dietaryConflicts, allergenConflicts: m.allergenConflicts, missing: m.missing.map((x) => x.name),
  };
}

let cache: { at: number; list: RecipeCard[] } | null = null;
const TTL = 60_000;

/** Tüm tarifleri malzemeleriyle birlikte (eşleştirme için) yükler. Tarif sayısı küçük olduğundan bellekte önbelleklenir. */
export async function loadAllRecipes(): Promise<RecipeCard[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.list;
  const [rows, items] = await Promise.all([
    db.select({ r: recipes, categorySlug: recipeCategories.slug, categoryName: recipeCategories.name })
      .from(recipes).innerJoin(recipeCategories, eq(recipeCategories.id, recipes.categoryId)),
    db.select({
      recipeId: recipeIngredients.recipeId, ingredientId: recipeIngredients.ingredientId, name: ingredients.name,
      slug: ingredients.slug, quantity: recipeIngredients.quantity, unit: recipeIngredients.unit,
      isOptional: recipeIngredients.isOptional, isEssential: recipeIngredients.isEssential,
      alwaysAvailable: ingredients.alwaysAvailable, gramsPerPiece: ingredients.gramsPerPiece, sortOrder: recipeIngredients.sortOrder,
    }).from(recipeIngredients).innerJoin(ingredients, eq(ingredients.id, recipeIngredients.ingredientId)),
  ]);
  const byRecipe = new Map<number, MatchRecipe["ingredients"]>();
  for (const it of items.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const arr = byRecipe.get(it.recipeId) ?? [];
    arr.push({
      ingredientId: it.ingredientId, name: it.name, slug: it.slug, quantity: it.quantity == null ? null : Number(it.quantity),
      unit: it.unit, isOptional: it.isOptional, isEssential: it.isEssential, alwaysAvailable: it.alwaysAvailable,
      gramsPerPiece: it.gramsPerPiece == null ? null : Number(it.gramsPerPiece),
    });
    byRecipe.set(it.recipeId, arr);
  }
  const list: RecipeCard[] = rows.map(({ r, categorySlug, categoryName }) => ({
    id: r.id, slug: r.slug, title: r.title, description: r.description, emoji: r.emoji, imageUrl: r.imageUrl,
    categorySlug, categoryName, totalMinutes: r.totalMinutes, prepMinutes: r.prepMinutes, cookMinutes: r.cookMinutes,
    servings: r.servings, difficulty: r.difficulty, costLevel: Number(r.costLevel), isVegetarian: r.isVegetarian,
    isVegan: r.isVegan, isGlutenFree: r.isGlutenFree, isLactoseFree: r.isLactoseFree, allergens: r.allergens,
    ingredients: byRecipe.get(r.id) ?? [],
  }));
  list.sort((a, b) => a.title.localeCompare(b.title, "tr"));
  cache = { at: Date.now(), list };
  return list;
}

export function clearRecipeCache() {
  cache = null;
}

/** Sanal kategoriler dahil kategori filtresi */
export function filterByCategory(list: RecipeCard[], cats: string[] | undefined) {
  if (!cats?.length) return list;
  return list.filter((r) => cats.some((c) =>
    c === "vejetaryen" ? r.isVegetarian : c === "pratik" ? r.totalMinutes <= 30 : r.categorySlug === c));
}

export function filterBySearch(list: RecipeCard[], q?: string) {
  if (!q) return list;
  const k = foldKey(q);
  return list.filter((r) => foldKey(r.title).includes(k) || r.ingredients.some((i) => foldKey(i.name).includes(k)));
}

export async function getPreferences(userId: string) {
  const p = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) });
  return p ?? {
    vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false, lowBudget: false, quickMeals: false,
    healthy: false, allergens: [] as string[], allergyNotes: null as string | null,
  };
}

export function toMatchPrefs(p: Awaited<ReturnType<typeof getPreferences>>): MatchPreferences {
  return {
    vegetarian: p.vegetarian, vegan: p.vegan, glutenFree: p.glutenFree, lactoseFree: p.lactoseFree,
    lowBudget: p.lowBudget, quickMeals: p.quickMeals, healthy: p.healthy, allergens: p.allergens,
  };
}

export interface RecommendParams {
  categories?: string[];
  sort?: SortKey;
  onlyComplete?: boolean;
  includeConflicts?: boolean;
  maxMinutes?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function recommendForUser(userId: string, params: RecommendParams = {}) {
  const [all, pantry, prefs, favs] = await Promise.all([
    loadAllRecipes(), getPantry(userId), getPreferences(userId),
    db.select({ recipeId: favorites.recipeId }).from(favorites).where(eq(favorites.userId, userId)),
  ]);
  const pool = filterBySearch(filterByCategory(all, params.categories), params.q);
  const { results, excludedByPreferences } = recommend(pool, pantry, toMatchPrefs(prefs), {
    sort: params.sort, onlyComplete: params.onlyComplete, includeConflicts: params.includeConflicts, maxMinutes: params.maxMinutes,
  });
  const page = params.page ?? 1, pageSize = params.pageSize ?? 12;
  const favSet = new Set(favs.map((f) => f.recipeId));
  const items = results.slice((page - 1) * pageSize, page * pageSize).map(({ recipe, match }) => ({
    recipe: stripIngredients(recipe), match: summarizeMatch(match), isFavorite: favSet.has(recipe.id),
  }));
  return {
    items, total: results.length, page, pageSize, totalPages: Math.max(1, Math.ceil(results.length / pageSize)),
    excludedByPreferences, pantryEmpty: pantry.length === 0,
  };
}

export type RecommendationItem = Awaited<ReturnType<typeof recommendForUser>>["items"][number];

export function stripIngredients(r: RecipeCard) {
  const { ingredients: _i, ...rest } = r;
  return rest;
}
export type RecipeSummary = ReturnType<typeof stripIngredients>;

export async function listRecipes(params: { q?: string; category?: string; page?: number; pageSize?: number }) {
  const all = await loadAllRecipes();
  const list = filterBySearch(filterByCategory(all, params.category ? [params.category] : undefined), params.q);
  const page = params.page ?? 1, pageSize = params.pageSize ?? 12;
  return {
    items: list.slice((page - 1) * pageSize, page * pageSize).map(stripIngredients),
    total: list.length, page, pageSize, totalPages: Math.max(1, Math.ceil(list.length / pageSize)),
  };
}

export async function getRecipeDetail(slugOrId: string, userId?: string) {
  const isId = /^\d+$/.test(slugOrId);
  const rec = await db.query.recipes.findFirst({
    where: isId ? eq(recipes.id, Number(slugOrId)) : eq(recipes.slug, slugOrId),
    with: {
      category: true,
      ingredients: { with: { ingredient: true }, orderBy: (ri, { asc }) => [asc(ri.sortOrder)] },
      steps: { orderBy: (s, { asc }) => [asc(s.order)] },
    },
  });
  if (!rec) throw notFound("Tarif");

  const card = (await loadAllRecipes()).find((r) => r.id === rec.id);
  let match: RecipeMatch | null = null;
  let isFavorite = false;
  let prefs: MatchPreferences | null = null;
  if (userId && card) {
    const [pantry, p, fav] = await Promise.all([
      getPantry(userId), getPreferences(userId),
      db.query.favorites.findFirst({ where: and(eq(favorites.userId, userId), eq(favorites.recipeId, rec.id)) }),
    ]);
    prefs = toMatchPrefs(p);
    match = matchRecipe(card, aggregatePantry(pantry), prefs);
    isFavorite = !!fav;
  }
  return {
    id: rec.id, slug: rec.slug, title: rec.title, description: rec.description, emoji: rec.emoji, imageUrl: rec.imageUrl,
    category: { slug: rec.category.slug, name: rec.category.name },
    prepMinutes: rec.prepMinutes, cookMinutes: rec.cookMinutes, totalMinutes: rec.totalMinutes, servings: rec.servings,
    difficulty: rec.difficulty, isVegetarian: rec.isVegetarian, isVegan: rec.isVegan, isGlutenFree: rec.isGlutenFree,
    isLactoseFree: rec.isLactoseFree, costLevel: Number(rec.costLevel), allergens: rec.allergens, nutrition: rec.nutrition,
    ingredients: rec.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId, name: ri.ingredient.name, quantity: ri.quantity == null ? null : Number(ri.quantity),
      unit: ri.unit, note: ri.note, isOptional: ri.isOptional, isEssential: ri.isEssential,
      alwaysAvailable: ri.ingredient.alwaysAvailable, allergens: ri.ingredient.allergens,
    })),
    steps: rec.steps.map((s) => s.text),
    match, isFavorite, userAllergens: prefs?.allergens ?? [],
  };
}
export type RecipeDetail = Awaited<ReturnType<typeof getRecipeDetail>>;

export async function getRecipesByIds(ids: number[]) {
  if (!ids.length) return [];
  const all = await loadAllRecipes();
  const set = new Set(ids);
  return all.filter((r) => set.has(r.id));
}

export async function recipeExists(id: number) {
  const r = await db.select({ id: recipes.id }).from(recipes).where(inArray(recipes.id, [id]));
  return r.length > 0;
}

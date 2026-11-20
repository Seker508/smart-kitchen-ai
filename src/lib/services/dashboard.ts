import { aiStatus } from "../ai/provider";
import { groupByExpiry } from "../expiry";
import { recommend, type Recommendation } from "../recommend";
import { listFavorites } from "./favorites";
import { getAllInventory } from "./inventory";
import { type RecipeCard, filterByCategory, getPreferences, loadAllRecipes, stripIngredients, summarizeMatch, toMatchPrefs } from "./recipes";
import { listShopping } from "./shopping";

export async function getExpiryOverview(userId: string) {
  const [inventory, all, prefs] = await Promise.all([getAllInventory(userId), loadAllRecipes(), getPreferences(userId)]);
  const groups = groupByExpiry(inventory);
  const pantry = inventory.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit, expiresAt: i.expiresAt }));
  const { results } = recommend(all, pantry, toMatchPrefs(prefs), { sort: "skt" });
  const recipes = results.filter((r) => r.match.expiringUsed > 0 && !r.match.missingEssential).slice(0, 6)
    .map(({ recipe, match }) => ({ recipe: stripIngredients(recipe), match: summarizeMatch(match), isFavorite: false }));
  return { groups, recipes, totalTracked: inventory.filter((i) => i.expiresAt).length };
}

export async function getDashboard(userId: string) {
  const [inventory, all, prefsRow, favorites, shopping] = await Promise.all([
    getAllInventory(userId), loadAllRecipes(), getPreferences(userId), listFavorites(userId), listShopping(userId),
  ]);
  const prefs = toMatchPrefs(prefsRow);
  const pantry = inventory.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit, expiresAt: i.expiresAt }));
  const favSet = new Set(favorites.map((f) => f.recipe.id));
  const view = (list: Recommendation<RecipeCard>[], n: number) => list.slice(0, n)
    .map(({ recipe, match }) => ({ recipe: stripIngredients(recipe), match: summarizeMatch(match), isFavorite: favSet.has(recipe.id) }));

  const mains = recommend(filterByCategory(all, ["ana-yemek", "corba"]), pantry, prefs, {}).results;
  const desserts = recommend(filterByCategory(all, ["tatli"]), pantry, prefs, {}).results;
  const everything = recommend(all, pantry, prefs, {}).results;
  const cookable = everything.filter((r) => r.match.missing.length === 0);
  const quickest = recommend(all, pantry, prefs, { sort: "sure" }).results.filter((r) => r.match.compatibility >= 60 && !r.match.missingEssential);

  const groups = groupByExpiry(inventory);
  const distinct = new Set(inventory.map((i) => i.ingredientId ?? i.name)).size;
  const byCategory = new Map<string, number>();
  for (const i of inventory) byCategory.set(i.categoryName, (byCategory.get(i.categoryName) ?? 0) + 1);

  return {
    stats: {
      distinctProducts: distinct, totalRows: inventory.length, expiringSoon: groups.urgent.length + groups.soon.length,
      expired: groups.expired.length, cookableCount: cookable.length, favorites: favorites.length,
      shoppingOpen: shopping.items.filter((i) => !i.isPurchased).length,
    },
    categories: [...byCategory.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    canCook: view(cookable.length ? cookable : everything, 4),
    meals: view(mains, 4),
    desserts: view(desserts, 4),
    quickest: view(quickest, 4),
    expiring: [...groups.urgent, ...groups.soon].slice(0, 6),
    expiredItems: groups.expired.slice(0, 4),
    favorites: favorites.slice(0, 4),
    shopping: shopping.items.filter((i) => !i.isPurchased).slice(0, 6),
    ai: aiStatus(),
    pantryEmpty: inventory.length === 0,
  };
}
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

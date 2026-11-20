import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { shoppingListItems, shoppingLists, type Unit } from "@/db/schema";
import { notFound } from "../api";
import { aggregatePantry, matchRecipe } from "../recommend";
import { convert } from "../units";
import { loadCatalog, resolveIngredient } from "./catalog";
import { addIngredient, getPantry } from "./inventory";
import { loadAllRecipes } from "./recipes";

export async function getOrCreateList(userId: string) {
  const existing = await db.query.shoppingLists.findFirst({ where: eq(shoppingLists.userId, userId) });
  if (existing) return existing;
  const [created] = await db.insert(shoppingLists).values({ userId }).onConflictDoNothing().returning();
  return created ?? (await db.query.shoppingLists.findFirst({ where: eq(shoppingLists.userId, userId) }))!;
}

export type ShoppingItem = {
  id: string; ingredientId: number | null; name: string; quantity: number | null; unit: Unit | null;
  isPurchased: boolean; fromRecipes: string[];
};

export async function listShopping(userId: string): Promise<{ id: string; name: string; items: ShoppingItem[] }> {
  const list = await getOrCreateList(userId);
  const items = await db.select().from(shoppingListItems).where(eq(shoppingListItems.listId, list.id))
    .orderBy(asc(shoppingListItems.isPurchased), asc(shoppingListItems.createdAt));
  return {
    id: list.id, name: list.name,
    items: items.map((i) => ({
      id: i.id, ingredientId: i.ingredientId, name: i.name, quantity: i.quantity == null ? null : Number(i.quantity),
      unit: i.unit, isPurchased: i.isPurchased, fromRecipes: i.fromRecipes,
    })),
  };
}

/**
 * Ürün ekler; aynı ürün listede satın alınmamış olarak varsa birleştirir (miktarlar dönüştürülebiliyorsa toplanır).
 */
export async function addShoppingItem(
  userId: string,
  input: { ingredientId?: number | null; name: string; quantity?: number | null; unit?: Unit | null; fromRecipe?: string },
) {
  const list = await getOrCreateList(userId);
  const { list: catalog } = await loadCatalog();
  const cat = input.ingredientId ? catalog.find((c) => c.id === input.ingredientId) ?? null : await resolveIngredient(input.name);
  const name = cat?.name ?? input.name.trim().toLocaleLowerCase("tr-TR");

  const same = await db.select().from(shoppingListItems).where(and(
    eq(shoppingListItems.listId, list.id), eq(shoppingListItems.isPurchased, false),
    cat ? eq(shoppingListItems.ingredientId, cat.id) : sql`lower(${shoppingListItems.name}) = ${name}`,
  ));
  const ex = same[0];
  if (ex) {
    let quantity = ex.quantity == null ? null : Number(ex.quantity);
    let unit = ex.unit;
    if (input.quantity != null && input.unit) {
      if (quantity == null || unit == null) { quantity = input.quantity; unit = input.unit; }
      else {
        const add = convert(input.quantity, input.unit, unit, { slug: cat?.slug, gramsPerPiece: cat?.gramsPerPiece ? Number(cat.gramsPerPiece) : null });
        if (add != null) quantity = Math.round((quantity + add) * 100) / 100;
      }
    }
    const fromRecipes = input.fromRecipe && !ex.fromRecipes.includes(input.fromRecipe) ? [...ex.fromRecipes, input.fromRecipe] : ex.fromRecipes;
    await db.update(shoppingListItems).set({ quantity: quantity == null ? null : String(quantity), unit, fromRecipes })
      .where(eq(shoppingListItems.id, ex.id));
    return { id: ex.id, merged: true };
  }
  const [created] = await db.insert(shoppingListItems).values({
    listId: list.id, ingredientId: cat?.id ?? null, name,
    quantity: input.quantity == null ? null : String(input.quantity), unit: input.unit ?? null,
    fromRecipes: input.fromRecipe ? [input.fromRecipe] : [],
  }).returning({ id: shoppingListItems.id });
  return { id: created.id, merged: false };
}

async function ownedItem(userId: string, id: string) {
  const list = await getOrCreateList(userId);
  const item = await db.query.shoppingListItems.findFirst({
    where: and(eq(shoppingListItems.id, id), eq(shoppingListItems.listId, list.id)),
  });
  if (!item) throw notFound("Liste ürünü");
  return item;
}

export async function updateShoppingItem(userId: string, id: string, patch: { isPurchased?: boolean; quantity?: number | null; unit?: string | null; name?: string }) {
  await ownedItem(userId, id);
  const set: Partial<typeof shoppingListItems.$inferInsert> = {};
  if (patch.isPurchased !== undefined) set.isPurchased = patch.isPurchased;
  if (patch.quantity !== undefined) set.quantity = patch.quantity == null ? null : String(patch.quantity);
  if (patch.unit !== undefined) set.unit = patch.unit as Unit | null;
  if (patch.name !== undefined) set.name = patch.name;
  await db.update(shoppingListItems).set(set).where(eq(shoppingListItems.id, id));
}

export async function deleteShoppingItem(userId: string, id: string) {
  await ownedItem(userId, id);
  await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));
}

export async function clearPurchased(userId: string) {
  const list = await getOrCreateList(userId);
  const res = await db.delete(shoppingListItems)
    .where(and(eq(shoppingListItems.listId, list.id), eq(shoppingListItems.isPurchased, true))).returning({ id: shoppingListItems.id });
  return res.length;
}

/** Satın alınan ürünleri envantere aktarır ve listeden kaldırır. */
export async function movePurchasedToInventory(userId: string) {
  const list = await getOrCreateList(userId);
  const items = await db.select().from(shoppingListItems)
    .where(and(eq(shoppingListItems.listId, list.id), eq(shoppingListItems.isPurchased, true)));
  let moved = 0;
  for (const it of items) {
    if (it.quantity == null || it.unit == null) continue;
    await addIngredient(userId, {
      ingredientId: it.ingredientId, name: it.name, quantity: Number(it.quantity), unit: it.unit, storage: "BUZDOLABI",
    }, "SHOPPING");
    moved++;
  }
  const movedIds = items.filter((i) => i.quantity != null && i.unit != null).map((i) => i.id);
  if (movedIds.length) await db.delete(shoppingListItems).where(inArray(shoppingListItems.id, movedIds));
  return { moved, skipped: items.length - moved };
}

/** Tarifteki eksik (ve isteğe bağlı olmayan) malzemeleri listeye ekler. */
export async function addMissingFromRecipe(userId: string, recipeId: number, servings?: number) {
  const recipe = (await loadAllRecipes()).find((r) => r.id === recipeId);
  if (!recipe) throw notFound("Tarif");
  const pantry = aggregatePantry(await getPantry(userId));
  const match = matchRecipe(recipe, pantry, {}, { servings });
  const factor = servings ? servings / recipe.servings : 1;
  const insufficient = match.have.filter((h) => h.sufficient === false && !h.isOptional).map((h) => h.ingredientId);
  const toAdd = [...match.missing.map((m) => m.ingredientId), ...insufficient];
  const added: string[] = [];
  for (const id of toAdd) {
    const ing = recipe.ingredients.find((i) => i.ingredientId === id)!;
    await addShoppingItem(userId, {
      ingredientId: id, name: ing.name,
      quantity: ing.quantity == null ? null : Math.round(ing.quantity * factor * 100) / 100,
      unit: ing.unit, fromRecipe: recipe.title,
    });
    added.push(ing.name);
  }
  return { added, recipe: recipe.title };
}

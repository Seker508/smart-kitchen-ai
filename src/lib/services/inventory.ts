import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { ingredientCategories, userIngredients, type StorageArea, type Unit } from "@/db/schema";
import { ApiError, notFound } from "../api";
import { daysUntil } from "../expiry";
import type { PantryItem } from "../recommend";
import { convert } from "../units";
import type { IngredientInput } from "../validation";
import { categoryIdBySlug, loadCatalog, resolveIngredient } from "./catalog";

export type InventoryRow = {
  id: string;
  ingredientId: number | null;
  name: string;
  categorySlug: string;
  categoryName: string;
  quantity: number;
  unit: Unit;
  storage: StorageArea;
  expiresAt: string | null;
  note: string | null;
  source: string;
  createdAt: Date;
};

const selectCols = {
  id: userIngredients.id,
  ingredientId: userIngredients.ingredientId,
  name: userIngredients.name,
  categorySlug: ingredientCategories.slug,
  categoryName: ingredientCategories.name,
  quantity: userIngredients.quantity,
  unit: userIngredients.unit,
  storage: userIngredients.storage,
  expiresAt: userIngredients.expiresAt,
  note: userIngredients.note,
  source: userIngredients.source,
  createdAt: userIngredients.createdAt,
};

const toRow = (r: Omit<InventoryRow, "quantity"> & { quantity: string }): InventoryRow => ({ ...r, quantity: Number(r.quantity) });

export interface InventoryQuery {
  q?: string;
  category?: string;
  storage?: StorageArea;
  sort?: "expiry" | "name" | "recent" | "quantity";
  page?: number;
  pageSize?: number;
}

export async function listInventory(userId: string, query: InventoryQuery = {}) {
  const { q, category, storage, sort = "expiry", page = 1, pageSize = 20 } = query;
  const conds: SQL[] = [eq(userIngredients.userId, userId)];
  if (q) {
    const term = `%${q.replace(/[%_\\]/g, "\\$&")}%`; // LIKE joker karakterlerini kaçır
    conds.push(or(ilike(userIngredients.name, term), ilike(userIngredients.note, term))!);
  }
  if (category) conds.push(eq(ingredientCategories.slug, category));
  if (storage) conds.push(eq(userIngredients.storage, storage));
  const where = and(...conds);

  const order = {
    expiry: [sql`${userIngredients.expiresAt} asc nulls last`, asc(userIngredients.name)],
    name: [asc(userIngredients.name)],
    recent: [desc(userIngredients.createdAt)],
    quantity: [desc(userIngredients.quantity)],
  }[sort];

  const [rows, [{ total }]] = await Promise.all([
    db.select(selectCols).from(userIngredients)
      .innerJoin(ingredientCategories, eq(ingredientCategories.id, userIngredients.categoryId))
      .where(where).orderBy(...order).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(userIngredients)
      .innerJoin(ingredientCategories, eq(ingredientCategories.id, userIngredients.categoryId)).where(where),
  ]);
  return { items: rows.map(toRow), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAllInventory(userId: string): Promise<InventoryRow[]> {
  const rows = await db.select(selectCols).from(userIngredients)
    .innerJoin(ingredientCategories, eq(ingredientCategories.id, userIngredients.categoryId))
    .where(eq(userIngredients.userId, userId))
    .orderBy(sql`${userIngredients.expiresAt} asc nulls last`, asc(userIngredients.name));
  return rows.map(toRow);
}

export async function getPantry(userId: string): Promise<PantryItem[]> {
  const rows = await db.select({
    ingredientId: userIngredients.ingredientId, quantity: userIngredients.quantity,
    unit: userIngredients.unit, expiresAt: userIngredients.expiresAt,
  }).from(userIngredients).where(eq(userIngredients.userId, userId));
  return rows.map((r) => ({ ...r, quantity: Number(r.quantity) }));
}

export async function inventoryStats(userId: string) {
  const rows = await db.select({ expiresAt: userIngredients.expiresAt, ingredientId: userIngredients.ingredientId, name: userIngredients.name })
    .from(userIngredients).where(eq(userIngredients.userId, userId));
  const distinct = new Set(rows.map((r) => r.ingredientId ?? r.name.toLocaleLowerCase("tr")));
  let expired = 0, soon = 0;
  for (const r of rows) {
    const d = daysUntil(r.expiresAt);
    if (d == null) continue;
    if (d < 0) expired++;
    else if (d <= 7) soon++;
  }
  return { totalRows: rows.length, distinctProducts: distinct.size, expired, soon };
}

/**
 * Malzeme ekler. Aynı malzeme aynı saklama alanında zaten varsa yeni kayıt açmak yerine
 * miktarı (birim dönüştürülebiliyorsa) mevcut kayda ekler ve en erken SKT'yi korur.
 */
export async function addIngredient(
  userId: string,
  input: IngredientInput,
  source: "MANUAL" | "IMAGE" | "SHOPPING" = "MANUAL",
): Promise<{ item: InventoryRow; merged: boolean }> {
  const { list } = await loadCatalog();
  let catalog = input.ingredientId ? list.find((x) => x.id === input.ingredientId) ?? null : null;
  if (input.ingredientId && !catalog) throw new ApiError(400, "Seçilen malzeme katalogda bulunamadı.", "BAD_INGREDIENT");
  if (!catalog) catalog = await resolveIngredient(input.name);

  const name = catalog ? catalog.name : input.name.trim().toLocaleLowerCase("tr-TR");
  const categoryId = catalog ? catalog.categoryId : await categoryIdBySlug(input.categorySlug ?? "diger");
  const storage = (input.storage ?? "BUZDOLABI") as StorageArea;
  const unit = input.unit as Unit;

  return db.transaction(async (tx) => {
    const sameIngredient = catalog
      ? eq(userIngredients.ingredientId, catalog.id)
      : sql`lower(${userIngredients.name}) = ${name}`;
    const existing = await tx.select().from(userIngredients)
      .where(and(eq(userIngredients.userId, userId), sameIngredient, eq(userIngredients.storage, storage)))
      .for("update");

    for (const ex of existing) {
      const add = convert(input.quantity, unit, ex.unit, { slug: catalog?.slug, gramsPerPiece: catalog?.gramsPerPiece ? Number(catalog.gramsPerPiece) : null });
      if (add == null) continue;
      const expiresAt = [ex.expiresAt, input.expiresAt ?? null].filter(Boolean).sort()[0] ?? null;
      const newQty = Math.round((Number(ex.quantity) + add) * 100) / 100;
      await tx.update(userIngredients)
        .set({ quantity: String(newQty), expiresAt, note: input.note ?? ex.note })
        .where(and(eq(userIngredients.id, ex.id), eq(userIngredients.userId, userId)));
      const item = await getItem(userId, ex.id, tx);
      return { item, merged: true };
    }

    const [created] = await tx.insert(userIngredients).values({
      userId, ingredientId: catalog?.id ?? null, name, categoryId, quantity: String(input.quantity), unit, storage,
      expiresAt: input.expiresAt ?? null, note: input.note ?? null, source,
    }).returning({ id: userIngredients.id });
    return { item: await getItem(userId, created.id, tx), merged: false };
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getItem(userId: string, id: string, tx: Tx | typeof db = db): Promise<InventoryRow> {
  const [row] = await tx.select(selectCols).from(userIngredients)
    .innerJoin(ingredientCategories, eq(ingredientCategories.id, userIngredients.categoryId))
    .where(and(eq(userIngredients.id, id), eq(userIngredients.userId, userId)));
  if (!row) throw notFound("Malzeme");
  return toRow(row);
}

export async function updateIngredient(
  userId: string, id: string,
  patch: { quantity?: number; unit?: string; storage?: string; expiresAt?: string | null; note?: string | null },
) {
  const set: Partial<typeof userIngredients.$inferInsert> = {};
  if (patch.quantity !== undefined) set.quantity = String(patch.quantity);
  if (patch.unit !== undefined) set.unit = patch.unit as Unit;
  if (patch.storage !== undefined) set.storage = patch.storage as StorageArea;
  if (patch.expiresAt !== undefined) set.expiresAt = patch.expiresAt;
  if (patch.note !== undefined) set.note = patch.note;
  const res = await db.update(userIngredients).set(set)
    .where(and(eq(userIngredients.id, id), eq(userIngredients.userId, userId)))
    .returning({ id: userIngredients.id });
  if (!res.length) throw notFound("Malzeme");
  return getItem(userId, id);
}

export async function deleteIngredient(userId: string, id: string) {
  const res = await db.delete(userIngredients)
    .where(and(eq(userIngredients.id, id), eq(userIngredients.userId, userId)))
    .returning({ id: userIngredients.id });
  if (!res.length) throw notFound("Malzeme");
}

export async function categoryCounts(userId: string) {
  return db.select({ slug: ingredientCategories.slug, name: ingredientCategories.name, count: count() })
    .from(userIngredients)
    .innerJoin(ingredientCategories, eq(ingredientCategories.id, userIngredients.categoryId))
    .where(eq(userIngredients.userId, userId))
    .groupBy(ingredientCategories.slug, ingredientCategories.name, ingredientCategories.sortOrder)
    .orderBy(asc(ingredientCategories.sortOrder));
}

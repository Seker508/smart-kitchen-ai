import { asc } from "drizzle-orm";
import { db } from "@/db";
import { ingredientCategories, ingredients } from "@/db/schema";
import { foldKey } from "../text";

export type CatalogIngredient = typeof ingredients.$inferSelect & { categorySlug: string };

let cache: { at: number; list: CatalogIngredient[]; index: Map<string, CatalogIngredient>; cats: Map<string, number> } | null = null;
const TTL = 5 * 60_000;

export async function loadCatalog() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const [rows, cats] = await Promise.all([
    db.select().from(ingredients).orderBy(asc(ingredients.name)),
    db.select().from(ingredientCategories),
  ]);
  const catSlug = new Map(cats.map((c) => [c.id, c.slug]));
  const list = rows.map((r) => ({ ...r, categorySlug: catSlug.get(r.categoryId) ?? "diger" }));
  const index = new Map<string, CatalogIngredient>();
  for (const ing of list) index.set(foldKey(ing.name), ing);
  for (const ing of list) for (const a of ing.aliases) if (!index.has(foldKey(a))) index.set(foldKey(a), ing);
  cache = { at: Date.now(), list, index, cats: new Map(cats.map((c) => [c.slug, c.id])) };
  return cache;
}

export function clearCatalogCache() {
  cache = null;
}

/** Serbest metinden katalog malzemesi bulur (ad, eş anlamlı adlar, tekil/çoğul ve basit ek temizliği). */
export async function resolveIngredient(name: string): Promise<CatalogIngredient | null> {
  const { index } = await loadCatalog();
  const key = foldKey(name);
  if (!key) return null;
  if (index.has(key)) return index.get(key)!;
  // Türkçe çoğul ekleri ve ek boşlukları dene: "domatesler" → "domates"
  const stripped = key.replace(/(ler|lar)$/, "");
  if (index.has(stripped)) return index.get(stripped)!;
  // Çok kelimeli adlarda son kelimeyi dene: "taze ıspanak yaprağı" gibi durumlar için baştaki sıfatları at
  const words = key.split(" ");
  for (let i = 1; i < words.length; i++) {
    const tail = words.slice(i).join(" ");
    if (index.has(tail)) return index.get(tail)!;
  }
  return null;
}

export async function searchCatalog(q: string, limit = 12) {
  const { list } = await loadCatalog();
  const key = foldKey(q);
  if (!key) return list.slice(0, limit);
  const scored = list
    .map((ing) => {
      const names = [ing.name, ...ing.aliases].map(foldKey);
      let score = 0;
      for (const n of names) {
        if (n === key) score = Math.max(score, 3);
        else if (n.startsWith(key)) score = Math.max(score, 2);
        else if (n.includes(key)) score = Math.max(score, 1);
      }
      return { ing, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.ing.name.localeCompare(b.ing.name, "tr"));
  return scored.slice(0, limit).map((x) => x.ing);
}

export async function categoryIdBySlug(slug: string) {
  const { cats } = await loadCatalog();
  return cats.get(slug) ?? cats.get("diger")!;
}

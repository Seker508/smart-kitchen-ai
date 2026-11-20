// .env dosyası varsa yükle; yoksa (ör. Railway) ortam değişkenleri zaten tanımlıdır
try { process.loadEnvFile(".env"); } catch { /* .env yok */ }
/**
 * Başlangıç verisi: malzeme kataloğu, tarif kategorileri, 100+ tarif ve (isteğe bağlı) demo kullanıcı.
 * İdempotenttir: tekrar çalıştırıldığında kayıtları günceller, kullanıcı verilerini (favoriler vb.) silmez.
 *   npm run db:seed            → katalog + tarifler + demo kullanıcı
 *   SEED_DEMO_USER=false npm run db:seed → demo kullanıcı olmadan
 */
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { closeDb, getDb, type DB } from "../index";
import * as s from "../schema";
import { CATALOG, INGREDIENT_CATEGORIES, RECIPE_CATEGORIES } from "./catalog";
import { anaYemekler } from "./recipes-ana-yemek";
import { corbalar } from "./recipes-corba";
import { tatlilar } from "./recipes-tatli";
import { kahvaltiliklar } from "./recipes-kahvalti";
import { atistirmaliklar, hamurIsleri, icecekler, salatalar } from "./recipes-diger";
import { UNIT_MAP, type RecipeSeed } from "./types";
import { slugify } from "../../lib/text";

export const ALL_RECIPES: RecipeSeed[] = [
  ...anaYemekler, ...corbalar, ...tatlilar, ...kahvaltiliklar, ...atistirmaliklar, ...salatalar, ...hamurIsleri, ...icecekler,
];

export async function seedCatalog(db: DB) {
  // Malzeme kategorileri
  for (const [i, c] of INGREDIENT_CATEGORIES.entries()) {
    await db.insert(s.ingredientCategories).values({ slug: c.slug, name: c.name, sortOrder: i })
      .onConflictDoUpdate({ target: s.ingredientCategories.slug, set: { name: c.name, sortOrder: i } });
  }
  const cats = await db.select().from(s.ingredientCategories);
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  for (const [name, cat, unit, cost, o = {}] of CATALOG) {
    const row = {
      slug: slugify(name), name, categoryId: catId.get(cat)!, defaultUnit: unit, costLevel: cost,
      aliases: o.al ?? [], allergens: o.a ?? [], isMeat: !!o.m, isAnimalProduct: !!o.an,
      alwaysAvailable: !!o.aa, gramsPerPiece: o.g != null ? String(o.g) : null,
    };
    if (!row.categoryId) throw new Error(`Bilinmeyen kategori: ${cat}`);
    await db.insert(s.ingredients).values(row).onConflictDoUpdate({ target: s.ingredients.slug, set: row });
  }

  for (const [i, c] of RECIPE_CATEGORIES.entries()) {
    await db.insert(s.recipeCategories).values({ ...c, sortOrder: i })
      .onConflictDoUpdate({ target: s.recipeCategories.slug, set: { name: c.name, isVirtual: c.isVirtual, sortOrder: i } });
  }
}

export async function seedRecipes(db: DB) {
  const ings = await db.select().from(s.ingredients);
  const cats = await db.select().from(s.ingredientCategories);
  const spiceCatId = cats.find((c) => c.slug === "baharatlar")?.id;
  const byName = new Map<string, (typeof ings)[number]>();
  for (const ing of ings) {
    byName.set(ing.name, ing);
    for (const a of ing.aliases) if (!byName.has(a)) byName.set(a, ing);
  }
  const rcats = await db.select().from(s.recipeCategories);
  const rcatId = new Map(rcats.map((c) => [c.slug, c.id]));

  const slugs = new Set<string>();
  for (const r of ALL_RECIPES) {
    const slug = slugify(r.t);
    if (slugs.has(slug)) throw new Error(`Tekrarlanan tarif: ${r.t}`);
    slugs.add(slug);

    const items = r.i.map(([name, qty, unit, flags, note], idx) => {
      const ing = byName.get(name);
      if (!ing) throw new Error(`"${r.t}" tarifindeki malzeme katalogda yok: ${name}`);
      return {
        ing, quantity: qty != null ? String(qty) : null, unit: unit ? UNIT_MAP[unit] : null,
        isEssential: flags === "e", isOptional: flags === "o",
        note: note ?? (name !== ing.name ? name : null), sortOrder: idx,
      };
    });
    const unique = new Set(items.map((x) => x.ing.id));
    if (unique.size !== items.length) throw new Error(`"${r.t}" tarifinde aynı malzeme iki kez geçiyor`);

    // Diyet ve alerjen bilgisi tarif içeriğinden türetilir (yapay zekâ tahmini değildir).
    const all = items.map((x) => x.ing);
    const allergens = [...new Set(all.flatMap((x) => x.allergens))].sort();
    const isVegetarian = !all.some((x) => x.isMeat);
    const isVegan = isVegetarian && !all.some((x) => x.isAnimalProduct);
    const costBase = items.filter((x) => !x.isOptional && !x.ing.alwaysAvailable && x.ing.categoryId !== spiceCatId);
    const costLevel = costBase.length ? costBase.reduce((a, x) => a + x.ing.costLevel, 0) / costBase.length : 1;

    const values = {
      slug, title: r.t, description: r.d, emoji: r.e, categoryId: rcatId.get(r.c)!,
      prepMinutes: r.p, cookMinutes: r.k, totalMinutes: r.p + r.k, servings: r.s, difficulty: r.z,
      isVegetarian, isVegan, isGlutenFree: !allergens.includes("gluten"), isLactoseFree: !allergens.includes("sut"),
      costLevel: costLevel.toFixed(2), allergens, nutrition: null,
    };
    const [rec] = await db.insert(s.recipes).values(values)
      .onConflictDoUpdate({ target: s.recipes.slug, set: values }).returning({ id: s.recipes.id });

    await db.delete(s.recipeIngredients).where(eq(s.recipeIngredients.recipeId, rec.id));
    await db.delete(s.recipeSteps).where(eq(s.recipeSteps.recipeId, rec.id));
    await db.insert(s.recipeIngredients).values(items.map((x) => ({
      recipeId: rec.id, ingredientId: x.ing.id, quantity: x.quantity, unit: x.unit,
      isEssential: x.isEssential, isOptional: x.isOptional, note: x.note, sortOrder: x.sortOrder,
    })));
    await db.insert(s.recipeSteps).values(r.st.map((text, i) => ({ recipeId: rec.id, order: i + 1, text })));
  }
  return slugs.size;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const DEMO_EMAIL = "demo@smartkitchen.ai";
export const DEMO_PASSWORD = "Demo12345!";

export async function seedDemoUser(db: DB) {
  const existing = await db.query.users.findFirst({ where: eq(s.users.email, DEMO_EMAIL) });
  if (existing) return existing.id;
  const [u] = await db.insert(s.users).values({
    firstName: "Demo", lastName: "Kullanıcı", email: DEMO_EMAIL, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
  }).returning();
  await db.insert(s.userPreferences).values({ userId: u.id });
  await db.insert(s.shoppingLists).values({ userId: u.id });

  const pantry: [string, number, s.Unit, s.StorageArea, number | null][] = [
    ["yumurta", 10, "ADET", "BUZDOLABI", 12], ["süt", 1000, "MILILITRE", "BUZDOLABI", 2],
    ["domates", 4, "ADET", "BUZDOLABI", 4], ["sivri biber", 5, "ADET", "BUZDOLABI", 3],
    ["beyaz peynir", 300, "GRAM", "BUZDOLABI", 15], ["yoğurt", 750, "GRAM", "BUZDOLABI", 1],
    ["tereyağı", 250, "GRAM", "BUZDOLABI", 30], ["patates", 6, "ADET", "MUTFAK_DOLABI", 20],
    ["kuru soğan", 4, "ADET", "MUTFAK_DOLABI", 30], ["un", 1000, "GRAM", "MUTFAK_DOLABI", 180],
    ["toz şeker", 1000, "GRAM", "MUTFAK_DOLABI", 365], ["tuz", 500, "GRAM", "MUTFAK_DOLABI", null],
    ["sıvı yağ", 1000, "MILILITRE", "MUTFAK_DOLABI", 200], ["kırmızı mercimek", 500, "GRAM", "MUTFAK_DOLABI", 240],
    ["pirinç", 1000, "GRAM", "MUTFAK_DOLABI", 300], ["domates salçası", 400, "GRAM", "BUZDOLABI", 25],
    ["kabak", 2, "ADET", "BUZDOLABI", -1], ["havuç", 3, "ADET", "BUZDOLABI", 6],
    ["karabiber", 50, "GRAM", "MUTFAK_DOLABI", null], ["pul biber", 50, "GRAM", "MUTFAK_DOLABI", null],
  ];
  const names = pantry.map((p) => p[0]);
  const ings = await db.select().from(s.ingredients).where(inArray(s.ingredients.name, names));
  const m = new Map(ings.map((i) => [i.name, i]));
  await db.insert(s.userIngredients).values(pantry.map(([name, q, unit, storage, exp]) => ({
    userId: u.id, ingredientId: m.get(name)!.id, categoryId: m.get(name)!.categoryId, name, quantity: String(q), unit, storage,
    expiresAt: exp == null ? null : daysFromNow(exp),
  })));
  return u.id;
}

async function main() {
  const db = getDb();
  console.log("➜ Malzeme kataloğu yükleniyor...");
  await seedCatalog(db);
  console.log(`  ✓ ${CATALOG.length} malzeme, ${INGREDIENT_CATEGORIES.length} kategori`);
  console.log("➜ Tarifler yükleniyor...");
  const n = await seedRecipes(db);
  console.log(`  ✓ ${n} tarif`);
  if (process.env.SEED_DEMO_USER !== "false") {
    await seedDemoUser(db);
    console.log(`  ✓ Demo kullanıcı: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }
  await closeDb();
}

if (/seed[\/]index\.ts$/.test(process.argv[1] ?? "")) {
  main().catch(async (e) => {
    console.error("✗ Seed hatası:", e instanceof Error ? e.message : e);
    await closeDb();
    process.exit(1);
  });
}

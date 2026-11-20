import { beforeAll, describe, expect, it } from "vitest";
import { prepareDb, Client } from "../helpers";
import * as register from "@/app/api/auth/register/route";
import * as ingredients from "@/app/api/ingredients/route";
import * as ingredient from "@/app/api/ingredients/[id]/route";
import * as recommend from "@/app/api/recipes/recommend/route";
import * as recipes from "@/app/api/recipes/route";
import * as recipe from "@/app/api/recipes/[slug]/route";
import * as favorites from "@/app/api/favorites/route";
import * as favorite from "@/app/api/favorites/[recipeId]/route";
import * as shopping from "@/app/api/shopping-list/route";
import * as shoppingItem from "@/app/api/shopping-list/[id]/route";
import * as fromRecipe from "@/app/api/shopping-list/from-recipe/route";
import * as shoppingActions from "@/app/api/shopping-list/actions/route";
import * as preferences from "@/app/api/preferences/route";
import * as expiry from "@/app/api/expiry/route";
import * as dashboard from "@/app/api/dashboard/route";

const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

async function newUser(email: string) {
  const c = new Client();
  await c.call(register.POST, "POST", "/api/auth/register", { firstName: "Test", lastName: "Kişi", email, password: "Sifre1234" });
  return c;
}

describe("mutfak envanteri", () => {
  let a: Client, b: Client;
  beforeAll(async () => {
    await prepareDb();
    a = await newUser("a@example.com");
    b = await newUser("b@example.com");
  });

  it("malzeme ekler ve katalogla eşleştirir (eş anlamlı ad: 'soğan' → 'kuru soğan')", async () => {
    const r = await a.call(ingredients.POST, "POST", "/api/ingredients", { name: "Soğan", quantity: 3, unit: "ADET", storage: "MUTFAK_DOLABI" });
    expect(r.status).toBe(201);
    expect(r.data.item.name).toBe("kuru soğan");
    expect(r.data.item.categorySlug).toBe("sebzeler");
  });

  it("aynı malzeme tekrar eklenince miktar birleştirilir (birim dönüşümüyle)", async () => {
    await a.call(ingredients.POST, "POST", "/api/ingredients", { name: "süt", quantity: 1, unit: "LITRE", expiresAt: day(5) });
    const r = await a.call(ingredients.POST, "POST", "/api/ingredients", { name: "süt", quantity: 500, unit: "MILILITRE", expiresAt: day(2) });
    expect(r.status).toBe(200);
    expect(r.data.merged).toBe(true);
    expect(r.data.item.quantity).toBe(1.5);
    expect(r.data.item.expiresAt).toBe(day(2)); // en erken SKT korunur
  });

  it("katalogda olmayan ürün seçilen kategoriyle kaydedilir", async () => {
    const r = await a.call(ingredients.POST, "POST", "/api/ingredients", { name: "Kinoa", categorySlug: "tahillar", quantity: 500, unit: "GRAM" });
    expect(r.data.item.ingredientId).toBeNull();
    expect(r.data.item.categorySlug).toBe("tahillar");
  });

  it("arama, kategori filtresi, sıralama ve sayfalama", async () => {
    for (const [name, exp] of [["yumurta", 10], ["domates", 1], ["sivri biber", 3], ["tuz", null]] as const) {
      await a.call(ingredients.POST, "POST", "/api/ingredients", { name, quantity: 4, unit: name === "tuz" ? "GRAM" : "ADET", expiresAt: exp == null ? null : day(exp) });
    }
    const all = await a.call(ingredients.GET, "GET", "/api/ingredients?sort=expiry&pageSize=3");
    expect(all.data.total).toBe(7);
    expect(all.data.items).toHaveLength(3);
    expect(all.data.items[0].name).toBe("domates");
    expect(all.data.totalPages).toBe(3);
    const s = await a.call(ingredients.GET, "GET", "/api/ingredients?q=biber");
    expect(s.data.items.map((i: any) => i.name)).toEqual(["sivri biber"]);
    const cat = await a.call(ingredients.GET, "GET", "/api/ingredients?category=sut-urunleri");
    expect(cat.data.items.map((i: any) => i.name).sort()).toEqual(["süt", "yumurta"]);
  });

  it("miktar günceller ve siler", async () => {
    const list = await a.call(ingredients.GET, "GET", "/api/ingredients?q=yumurta");
    const id = list.data.items[0].id;
    const u = await a.call(ingredient.PUT, "PUT", `/api/ingredients/${id}`, { quantity: 12 }, { id });
    expect(u.data.item.quantity).toBe(12);
    const bad = await a.call(ingredient.PUT, "PUT", `/api/ingredients/${id}`, { quantity: -1 }, { id });
    expect(bad.status).toBe(400);
  });

  it("kullanıcı verileri izole: B, A'nın malzemesini göremez/değiştiremez/silemez", async () => {
    const list = await a.call(ingredients.GET, "GET", "/api/ingredients");
    const id = list.data.items[0].id;
    expect((await b.call(ingredients.GET, "GET", "/api/ingredients")).data.total).toBe(0);
    expect((await b.call(ingredient.GET, "GET", `/api/ingredients/${id}`, undefined, { id })).status).toBe(404);
    expect((await b.call(ingredient.PUT, "PUT", `/api/ingredients/${id}`, { quantity: 1 }, { id })).status).toBe(404);
    expect((await b.call(ingredient.DELETE, "DELETE", `/api/ingredients/${id}`, undefined, { id })).status).toBe(404);
    expect((await a.call(ingredient.GET, "GET", `/api/ingredients/${id}`, undefined, { id })).status).toBe(200);
    expect((await a.call(ingredient.DELETE, "DELETE", `/api/ingredients/${id}`, undefined, { id })).status).toBe(200);
  });

  it("SQL enjeksiyonu denemesi arama parametresinde zararsızdır", async () => {
    const r = await a.call(ingredients.GET, "GET", `/api/ingredients?q=${encodeURIComponent("' OR 1=1; drop table users;--")}`);
    expect(r.status).toBe(200);
    expect(r.data.total).toBe(0);
  });
});

describe("tarifler, öneri algoritması, favoriler, alışveriş listesi", () => {
  let c: Client;
  beforeAll(async () => {
    await prepareDb();
    c = await newUser("chef@example.com");
    // Menemen: yumurta, domates, sivri biber, kuru soğan, tuz (+ isteğe bağlı tereyağı, pul biber)
    for (const [name, q, unit, exp] of [
      ["yumurta", 6, "ADET", 10], ["domates", 3, "ADET", 1], ["sivri biber", 3, "ADET", 2], ["tuz", 500, "GRAM", null],
    ] as const) {
      await c.call(ingredients.POST, "POST", "/api/ingredients", { name, quantity: q, unit, expiresAt: exp == null ? null : day(exp) });
    }
  });

  it("veritabanında 100+ tekil tarif var", async () => {
    const r = await new Client().call(recipes.GET, "GET", "/api/recipes?pageSize=60");
    expect(r.data.total).toBeGreaterThanOrEqual(100);
    const titles = new Set(r.data.items.map((x: any) => x.title));
    expect(titles.size).toBe(r.data.items.length);
  });

  it("Menemen uyumluluğu gerçek veriden %80 (4/5) hesaplanır", async () => {
    const r = await c.call(recipe.GET, "GET", "/api/recipes/menemen", undefined, { slug: "menemen" });
    expect(r.status).toBe(200);
    const m = r.data.recipe.match;
    expect(m.compatibility).toBe(80);
    expect(m.missing.map((x: any) => x.name)).toEqual(["kuru soğan"]);
    expect(m.readiness).toBe("EKSIK_MALZEME");
    expect(r.data.recipe.steps.length).toBeGreaterThan(2);
    expect(r.data.recipe.allergens).toContain("yumurta");
  });

  it("öneriler kategoriye göre filtrelenir ve sıralanır", async () => {
    const r = await c.call(recommend.POST, "POST", "/api/recipes/recommend", { category: "kahvaltilik", sort: "uyum" });
    expect(r.data.items[0].recipe.slug).toBe("menemen");
    expect(r.data.items.every((x: any) => x.recipe.categorySlug === "kahvaltilik")).toBe(true);
    const comps = r.data.items.map((x: any) => x.match.compatibility);
    expect([...comps].sort((a, b) => b - a)).toEqual(comps);
    const quick = await c.call(recommend.POST, "POST", "/api/recipes/recommend", { sort: "sure", pageSize: 5 });
    const mins = quick.data.items.map((x: any) => x.recipe.totalMinutes);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
  });

  it("SKT yaklaşan malzemeleri kullanan tarifler önceliklendirilir", async () => {
    const r = await c.call(recommend.POST, "POST", "/api/recipes/recommend", { sort: "skt", pageSize: 3 });
    expect(r.data.items[0].match.expiringUsed).toBeGreaterThan(0);
  });

  it("tüm malzemesi olanlar filtresi", async () => {
    await c.call(ingredients.POST, "POST", "/api/ingredients", { name: "kuru soğan", quantity: 2, unit: "ADET" });
    const r = await c.call(recommend.POST, "POST", "/api/recipes/recommend", { onlyComplete: true, pageSize: 50 });
    expect(r.data.items.map((x: any) => x.recipe.slug)).toContain("menemen");
    expect(r.data.items.every((x: any) => x.match.missing.length === 0)).toBe(true);
  });

  it("diyet tercihleri ve alerjenler filtrelemede dikkate alınır", async () => {
    const p = await c.call(preferences.PUT, "PUT", "/api/preferences", {
      vegetarian: true, vegan: false, glutenFree: false, lactoseFree: false, lowBudget: false, quickMeals: false, healthy: false, allergens: ["yumurta"],
    });
    expect(p.status).toBe(200);
    const r = await c.call(recommend.POST, "POST", "/api/recipes/recommend", { pageSize: 60 });
    expect(r.data.excludedByPreferences).toBeGreaterThan(0);
    expect(r.data.items.some((x: any) => x.recipe.slug === "menemen")).toBe(false);
    expect(r.data.items.some((x: any) => x.recipe.slug === "karniyarik")).toBe(false);
    await c.call(preferences.PUT, "PUT", "/api/preferences", {
      vegetarian: false, vegan: false, glutenFree: false, lactoseFree: false, lowBudget: false, quickMeals: false, healthy: false, allergens: [],
    });
  });

  it("favori ekler, listeler, kaldırır", async () => {
    const det = await c.call(recipe.GET, "GET", "/api/recipes/sutlac", undefined, { slug: "sutlac" });
    const id = det.data.recipe.id;
    expect((await c.call(favorites.POST, "POST", "/api/favorites", { recipeId: id })).status).toBe(201);
    expect((await c.call(favorites.POST, "POST", "/api/favorites", { recipeId: id })).status).toBe(201); // idempotent
    const l = await c.call(favorites.GET, "GET", "/api/favorites");
    expect(l.data.items).toHaveLength(1);
    expect(l.data.items[0].recipe.slug).toBe("sutlac");
    expect((await c.call(favorites.POST, "POST", "/api/favorites", { recipeId: 999999 })).status).toBe(404);
    expect((await c.call(favorite.DELETE, "DELETE", `/api/favorites/${id}`, undefined, { recipeId: String(id) })).status).toBe(200);
    expect((await c.call(favorites.GET, "GET", "/api/favorites")).data.items).toHaveLength(0);
  });

  it("tariften eksik malzemeleri alışveriş listesine ekler ve aynı ürünleri birleştirir", async () => {
    const det = await c.call(recipe.GET, "GET", "/api/recipes/sutlac", undefined, { slug: "sutlac" });
    const r = await c.call(fromRecipe.POST, "POST", "/api/shopping-list/from-recipe", { recipeId: det.data.recipe.id });
    expect(r.data.added).toEqual(expect.arrayContaining(["süt", "pirinç", "toz şeker"]));
    expect(r.data.added).not.toContain("vanilin"); // isteğe bağlı
    await c.call(shopping.POST, "POST", "/api/shopping-list", { name: "Süt", quantity: 1, unit: "LITRE" });
    const list = await c.call(shopping.GET, "GET", "/api/shopping-list");
    const milk = list.data.items.filter((i: any) => i.name === "süt");
    expect(milk).toHaveLength(1);
    expect(milk[0].quantity).toBe(2); // 1 L + 1 L
    expect(milk[0].fromRecipes).toContain("Sütlaç");
  });

  it("satın alındı işaretler, envantere aktarır", async () => {
    const list = await c.call(shopping.GET, "GET", "/api/shopping-list");
    const milk = list.data.items.find((i: any) => i.name === "süt");
    await c.call(shoppingItem.PATCH, "PATCH", `/api/shopping-list/${milk.id}`, { isPurchased: true }, { id: milk.id });
    const mv = await c.call(shoppingActions.POST, "POST", "/api/shopping-list/actions", { action: "move-to-inventory" });
    expect(mv.data.message).toMatch(/1 ürün envantere aktarıldı/);
    const inv = await c.call(ingredients.GET, "GET", "/api/ingredients?q=süt");
    expect(inv.data.items[0].source).toBe("SHOPPING");
    const other = await newUser("other@example.com");
    const anyItem = (await c.call(shopping.GET, "GET", "/api/shopping-list")).data.items[0];
    expect((await other.call(shoppingItem.DELETE, "DELETE", `/api/shopping-list/${anyItem.id}`, undefined, { id: anyItem.id })).status).toBe(404);
  });

  it("SKT takibi üç grup döner ve dashboard gerçek veriyi gösterir", async () => {
    await c.call(ingredients.POST, "POST", "/api/ingredients", { name: "yoğurt", quantity: 500, unit: "GRAM", expiresAt: day(-2) });
    const e = await c.call(expiry.GET, "GET", "/api/expiry");
    expect(e.data.groups.expired.map((x: any) => x.name)).toContain("yoğurt");
    expect(e.data.groups.urgent.map((x: any) => x.name)).toEqual(expect.arrayContaining(["domates", "sivri biber"]));
    const d = await c.call(dashboard.GET, "GET", "/api/dashboard");
    expect(d.data.stats.distinctProducts).toBeGreaterThanOrEqual(6);
    expect(d.data.stats.expired).toBe(1);
    expect(d.data.meals.length).toBeGreaterThan(0);
    expect(d.data.desserts.every((x: any) => x.recipe.categorySlug === "tatli")).toBe(true);
    expect(d.data.ai.configured).toBe(false);
  });
});

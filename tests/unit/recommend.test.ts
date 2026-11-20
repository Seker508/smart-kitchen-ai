import { describe, expect, it } from "vitest";
import { aggregatePantry, matchRecipe, recommend, type MatchRecipe, type PantryItem } from "@/lib/recommend";

const ing = (id: number, name: string, o: Partial<MatchRecipe["ingredients"][number]> = {}) => ({
  ingredientId: id, name, slug: name, quantity: null, unit: null, isOptional: false, isEssential: false,
  alwaysAvailable: false, gramsPerPiece: null, ...o,
});
const base = (o: Partial<MatchRecipe>): MatchRecipe => ({
  id: 1, slug: "x", title: "X", categorySlug: "ana-yemek", totalMinutes: 30, servings: 2, costLevel: 1,
  isVegetarian: true, isVegan: false, isGlutenFree: true, isLactoseFree: true, allergens: [], ingredients: [], ...o,
});
const today = new Date(2026, 10, 20);
const p = (id: number, quantity = 1, unit: PantryItem["unit"] = "ADET", expiresAt: string | null = null): PantryItem =>
  ({ ingredientId: id, quantity, unit, expiresAt });

// Spesifikasyondaki örnek: Menemen — yumurta, domates, biber, soğan, tuz
const menemen = base({
  id: 10, title: "Menemen", ingredients: [
    ing(1, "yumurta", { isEssential: true }), ing(2, "domates", { isEssential: true }), ing(3, "biber"),
    ing(4, "soğan"), ing(5, "tuz"),
  ],
});

describe("uyumluluk yüzdesi", () => {
  it("spesifikasyon örneği: 4/5 malzeme = %80", () => {
    const m = matchRecipe(menemen, aggregatePantry([p(1), p(2), p(3), p(5)], today));
    expect(m.compatibility).toBe(80);
    expect(m.haveCount).toBe(4);
    expect(m.requiredCount).toBe(5);
    expect(m.missing.map((x) => x.name)).toEqual(["soğan"]);
    expect(m.readiness).toBe("EKSIK_MALZEME");
    expect(m.missingEssential).toBe(false);
  });

  it("ana malzeme eksikse hazırlanabilirlik ayrıca belirtilir", () => {
    const m = matchRecipe(menemen, aggregatePantry([p(2), p(3), p(4), p(5)], today));
    expect(m.compatibility).toBe(80);
    expect(m.missingEssential).toBe(true);
    expect(m.readiness).toBe("ANA_MALZEME_EKSIK");
  });

  it("isteğe bağlı malzemeler ve su yüzdeyi etkilemez", () => {
    const r = base({ ingredients: [ing(1, "a"), ing(2, "b", { isOptional: true }), ing(3, "su", { alwaysAvailable: true })] });
    const m = matchRecipe(r, aggregatePantry([p(1)], today));
    expect(m.compatibility).toBe(100);
    expect(m.missingOptional).toHaveLength(1);
    expect(m.readiness).toBe("HAZIR");
  });

  it("tarihi geçmiş ürünler sahip olunan sayılmaz", () => {
    const m = matchRecipe(menemen, aggregatePantry([p(1, 4, "ADET", "2026-11-19"), p(2), p(3), p(4), p(5)], today));
    expect(m.compatibility).toBe(80);
    expect(m.missing[0].name).toBe("yumurta");
  });
});

describe("miktar kontrolü", () => {
  const r = base({ servings: 2, ingredients: [ing(1, "un", { slug: "un", quantity: 2, unit: "SU_BARDAGI" }), ing(2, "yumurta", { quantity: 4, unit: "ADET" })] });

  it("birim dönüştürerek yeterliliği hesaplar (un: 2 sb ≈ 240 g)", () => {
    const ok = matchRecipe(r, aggregatePantry([p(1, 500, "GRAM"), p(2, 6)], today));
    expect(ok.have.every((h) => h.sufficient === true)).toBe(true);
    const low = matchRecipe(r, aggregatePantry([p(1, 100, "GRAM"), p(2, 3)], today));
    expect(low.insufficientCount).toBe(2);
    expect(low.readiness).toBe("MIKTAR_YETERSIZ");
  });

  it("aynı malzemenin birden fazla kaydını toplar", () => {
    const m = matchRecipe(r, aggregatePantry([p(1, 1, "KILOGRAM"), p(2, 2), p(2, 2)], today));
    expect(m.insufficientCount).toBe(0);
  });

  it("porsiyon artınca ihtiyaç ölçeklenir", () => {
    const m = matchRecipe(r, aggregatePantry([p(1, 1, "KILOGRAM"), p(2, 6)], today), {}, { servings: 4 });
    expect(m.have.find((h) => h.name === "yumurta")?.sufficient).toBe(false);
  });

  it("dönüştürülemeyen birimlerde tahmin yapmaz (null)", () => {
    const r2 = base({ ingredients: [ing(9, "maydanoz", { quantity: 1, unit: "DEMET" })] });
    const m = matchRecipe(r2, aggregatePantry([p(9, 100, "GRAM")], today));
    expect(m.have[0].sufficient).toBeNull();
    expect(m.readiness).toBe("HAZIR");
  });
});

describe("öneri listesi", () => {
  const quick = base({ id: 1, title: "Hızlı", totalMinutes: 10, costLevel: 2, ingredients: [ing(1, "a"), ing(2, "b")] });
  const slow = base({ id: 2, title: "Yavaş", totalMinutes: 90, costLevel: 1, ingredients: [ing(1, "a"), ing(3, "c")] });
  const meat = base({ id: 3, title: "Etli", isVegetarian: false, allergens: ["gluten"], ingredients: [ing(1, "a")] });
  const pantry = [p(1), p(2, 1, "ADET", "2026-11-21")];

  it("diyet tercihine uymayanları çıkarır ve sayısını raporlar", () => {
    const { results, excludedByPreferences } = recommend([quick, slow, meat], pantry, { vegetarian: true }, { today });
    expect(results.map((r) => r.recipe.id)).not.toContain(3);
    expect(excludedByPreferences).toBe(1);
  });

  it("alerjen çakışmasını yakalar", () => {
    const { results } = recommend([meat], pantry, { allergens: ["gluten"] }, { today, includeConflicts: true });
    expect(results[0].match.allergenConflicts).toEqual(["gluten"]);
  });

  it("sadece tüm malzemeleri olanları filtreler", () => {
    const { results } = recommend([quick, slow], pantry, {}, { today, onlyComplete: true });
    expect(results.map((r) => r.recipe.title)).toEqual(["Hızlı"]);
  });

  it("sıralama seçenekleri", () => {
    const by = (sort: Parameters<typeof recommend>[3] extends infer O ? O extends { sort?: infer S } ? S : never : never) =>
      recommend([slow, quick], pantry, {}, { today, sort }).results.map((r) => r.recipe.title);
    expect(by("sure")).toEqual(["Hızlı", "Yavaş"]);
    expect(by("ekonomik")).toEqual(["Yavaş", "Hızlı"]);
    expect(by("uyum")).toEqual(["Hızlı", "Yavaş"]);
    expect(by("eksik")).toEqual(["Hızlı", "Yavaş"]);
    expect(by("skt")[0]).toBe("Hızlı"); // b'nin SKT'si yaklaşıyor
  });

  it("SKT yaklaşan ürünü kullanan tarif puan kazanır", () => {
    const { results } = recommend([quick], pantry, {}, { today });
    expect(results[0].match.expiringUsed).toBe(1);
    expect(results[0].match.score).toBeGreaterThan(100);
  });
});

/**
 * Akıllı tarif öneri algoritması (saf fonksiyonlar — veritabanından bağımsız ve birim testli).
 *
 * Uyumluluk yüzdesi = sahip olunan zorunlu malzeme sayısı / zorunlu malzeme sayısı × 100
 *   - "İsteğe bağlı" malzemeler ve her zaman mevcut sayılan su hesaba katılmaz.
 *   - Tarihi geçmiş ürünler "sahip olunan" sayılmaz (tüketim önerisi yapılmaz).
 * Hazırlanabilirlik ayrıca değerlendirilir: ana malzeme eksikse tarif "hazırlanamaz" işaretlenir.
 * Sıralama puanı; uyumluluk, miktar yeterliliği, SKT yaklaşan ürün kullanımı ve kullanıcı tercihlerinin
 * ağırlıklı toplamıdır.
 */
import type { Unit } from "@/db/schema";
import { EXPIRY_SOON_DAYS, EXPIRY_URGENT_DAYS } from "./constants";
import { daysUntil } from "./expiry";
import { convert } from "./units";

export interface MatchIngredient {
  ingredientId: number;
  name: string;
  slug: string;
  quantity: number | null;
  unit: Unit | null;
  isOptional: boolean;
  isEssential: boolean;
  alwaysAvailable: boolean;
  gramsPerPiece: number | null;
}

export interface MatchRecipe {
  id: number;
  slug: string;
  title: string;
  categorySlug: string;
  totalMinutes: number;
  servings: number;
  costLevel: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  allergens: string[];
  ingredients: MatchIngredient[];
}

export interface PantryItem {
  ingredientId: number | null;
  quantity: number;
  unit: Unit;
  expiresAt: string | null;
}

export interface MatchPreferences {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  lactoseFree?: boolean;
  lowBudget?: boolean;
  quickMeals?: boolean;
  healthy?: boolean;
  allergens?: string[];
}

export type Readiness = "HAZIR" | "MIKTAR_YETERSIZ" | "EKSIK_MALZEME" | "ANA_MALZEME_EKSIK";

export interface IngredientStatus {
  ingredientId: number;
  name: string;
  isEssential: boolean;
  isOptional: boolean;
  /** true: yeterli, false: yetersiz, null: birimler karşılaştırılamadı veya tarifte miktar yok */
  sufficient: boolean | null;
  expiringInDays: number | null;
}

export interface RecipeMatch {
  recipeId: number;
  compatibility: number; // 0-100
  haveCount: number;
  requiredCount: number;
  have: IngredientStatus[];
  missing: IngredientStatus[];
  missingOptional: IngredientStatus[];
  insufficientCount: number;
  missingEssential: boolean;
  readiness: Readiness;
  expiringUsed: number;
  dietaryConflicts: string[];
  allergenConflicts: string[];
  score: number;
}

export type SortKey = "onerilen" | "uyum" | "eksik" | "sure" | "ekonomik" | "skt";

export const SORT_LABELS: Record<SortKey, string> = {
  onerilen: "Önerilen",
  uyum: "En yüksek malzeme uyumu",
  eksik: "En az eksik malzeme",
  sure: "En kısa hazırlama süresi",
  ekonomik: "En ekonomik",
  skt: "SKT yaklaşan ürünleri kullananlar",
};

interface PantryAgg {
  entries: { quantity: number; unit: Unit; days: number | null }[];
  minDays: number | null;
}

/** Envanteri malzeme kimliğine göre gruplar; tarihi geçmiş ürünleri dışarıda bırakır. */
export function aggregatePantry(items: PantryItem[], today: Date = new Date()): Map<number, PantryAgg> {
  const map = new Map<number, PantryAgg>();
  for (const it of items) {
    if (it.ingredientId == null || it.quantity <= 0) continue;
    const days = daysUntil(it.expiresAt, today);
    if (days != null && days < 0) continue; // tarihi geçmiş
    const agg = map.get(it.ingredientId) ?? { entries: [], minDays: null };
    agg.entries.push({ quantity: it.quantity, unit: it.unit, days });
    if (days != null) agg.minDays = agg.minDays == null ? days : Math.min(agg.minDays, days);
    map.set(it.ingredientId, agg);
  }
  return map;
}

function checkSufficiency(ing: MatchIngredient, agg: PantryAgg, servingsFactor: number): boolean | null {
  if (ing.quantity == null || ing.unit == null) return null;
  const needed = ing.quantity * servingsFactor;
  let total = 0;
  for (const e of agg.entries) {
    const c = convert(e.quantity, e.unit, ing.unit, { slug: ing.slug, gramsPerPiece: ing.gramsPerPiece });
    if (c == null) return null; // güvenilir dönüşüm yok → bilinmiyor
    total += c;
  }
  return total + 1e-9 >= needed;
}

export function dietaryConflicts(r: MatchRecipe, p: MatchPreferences): string[] {
  const out: string[] = [];
  if (p.vegan && !r.isVegan) out.push("vegan");
  else if (p.vegetarian && !r.isVegetarian) out.push("vejetaryen");
  if (p.glutenFree && !r.isGlutenFree) out.push("glutensiz");
  if (p.lactoseFree && !r.isLactoseFree) out.push("laktozsuz");
  return out;
}

export function matchRecipe(
  recipe: MatchRecipe,
  pantry: Map<number, PantryAgg>,
  prefs: MatchPreferences = {},
  opts: { servings?: number } = {},
): RecipeMatch {
  const factor = opts.servings && recipe.servings ? opts.servings / recipe.servings : 1;
  const have: IngredientStatus[] = [];
  const missing: IngredientStatus[] = [];
  const missingOptional: IngredientStatus[] = [];
  let required = 0;

  for (const ing of recipe.ingredients) {
    if (ing.alwaysAvailable) continue;
    const agg = pantry.get(ing.ingredientId);
    const status: IngredientStatus = {
      ingredientId: ing.ingredientId, name: ing.name, isEssential: ing.isEssential, isOptional: ing.isOptional,
      sufficient: null, expiringInDays: agg?.minDays ?? null,
    };
    if (!ing.isOptional) required++;
    if (agg) {
      status.sufficient = checkSufficiency(ing, agg, factor);
      have.push(status);
    } else if (ing.isOptional) {
      missingOptional.push(status);
    } else {
      missing.push(status);
    }
  }

  const haveRequired = have.filter((h) => !h.isOptional);
  const compatibility = required === 0 ? 100 : Math.round((haveRequired.length / required) * 100);
  const insufficientCount = haveRequired.filter((h) => h.sufficient === false).length;
  const missingEssential = missing.some((m) => m.isEssential);
  const readiness: Readiness = missingEssential
    ? "ANA_MALZEME_EKSIK"
    : missing.length > 0
      ? "EKSIK_MALZEME"
      : insufficientCount > 0 ? "MIKTAR_YETERSIZ" : "HAZIR";

  const expiringUsed = have.filter((h) => h.expiringInDays != null && h.expiringInDays <= EXPIRY_SOON_DAYS).length;
  const urgentUsed = have.filter((h) => h.expiringInDays != null && h.expiringInDays <= EXPIRY_URGENT_DAYS).length;
  const allergenConflicts = (prefs.allergens ?? []).filter((a) => recipe.allergens.includes(a));
  const dietConf = dietaryConflicts(recipe, prefs);

  // Ağırlıklı sıralama puanı
  let score = compatibility;
  score -= insufficientCount * 5;
  score -= missingEssential ? 25 : 0;
  score += expiringUsed * 4 + urgentUsed * 4;
  if (prefs.quickMeals && recipe.totalMinutes <= 30) score += 10;
  if (prefs.lowBudget) score += (3 - recipe.costLevel) * 5;
  if (prefs.healthy) {
    if (recipe.categorySlug === "salata" || recipe.categorySlug === "corba") score += 5;
    if (recipe.categorySlug === "tatli") score -= 5;
  }

  return {
    recipeId: recipe.id, compatibility, haveCount: haveRequired.length, requiredCount: required, have, missing,
    missingOptional, insufficientCount, missingEssential, readiness, expiringUsed, dietaryConflicts: dietConf,
    allergenConflicts, score: Math.round(score * 10) / 10,
  };
}

export interface RecommendOptions {
  sort?: SortKey;
  onlyComplete?: boolean;
  /** Diyet/alerjen çakışması olan tarifleri de göster (uyarıyla) */
  includeConflicts?: boolean;
  maxMinutes?: number;
  minCompatibility?: number;
  servings?: number;
  today?: Date;
}

export interface Recommendation<R extends MatchRecipe = MatchRecipe> {
  recipe: R;
  match: RecipeMatch;
}

export function recommend<R extends MatchRecipe>(
  recipes: R[],
  pantryItems: PantryItem[],
  prefs: MatchPreferences = {},
  options: RecommendOptions = {},
): { results: Recommendation<R>[]; excludedByPreferences: number } {
  const pantry = aggregatePantry(pantryItems, options.today);
  let excluded = 0;
  const results: Recommendation<R>[] = [];
  for (const r of recipes) {
    const match = matchRecipe(r, pantry, prefs, { servings: options.servings });
    const conflicted = match.dietaryConflicts.length > 0 || match.allergenConflicts.length > 0;
    if (conflicted && !options.includeConflicts) { excluded++; continue; }
    if (options.onlyComplete && match.missing.length > 0) continue;
    if (options.maxMinutes && r.totalMinutes > options.maxMinutes) continue;
    if (options.minCompatibility != null && match.compatibility < options.minCompatibility) continue;
    results.push({ recipe: r, match });
  }
  sortRecommendations(results, options.sort ?? "onerilen");
  return { results, excludedByPreferences: excluded };
}

export function sortRecommendations<R extends MatchRecipe>(list: Recommendation<R>[], sort: SortKey) {
  const cmp: Record<SortKey, (a: Recommendation<R>, b: Recommendation<R>) => number> = {
    onerilen: (a, b) => b.match.score - a.match.score || b.match.compatibility - a.match.compatibility,
    uyum: (a, b) => b.match.compatibility - a.match.compatibility || b.match.score - a.match.score,
    eksik: (a, b) => a.match.missing.length - b.match.missing.length || b.match.compatibility - a.match.compatibility,
    sure: (a, b) => a.recipe.totalMinutes - b.recipe.totalMinutes || b.match.compatibility - a.match.compatibility,
    ekonomik: (a, b) => a.recipe.costLevel - b.recipe.costLevel || a.match.missing.length - b.match.missing.length,
    skt: (a, b) => b.match.expiringUsed - a.match.expiringUsed || b.match.compatibility - a.match.compatibility,
  };
  list.sort((a, b) => cmp[sort](a, b) || a.recipe.title.localeCompare(b.recipe.title, "tr"));
  return list;
}

export const READINESS_LABELS: Record<Readiness, string> = {
  HAZIR: "Hemen hazırlanabilir",
  MIKTAR_YETERSIZ: "Miktar yetersiz olabilir",
  EKSIK_MALZEME: "Birkaç malzeme eksik",
  ANA_MALZEME_EKSIK: "Ana malzeme eksik",
};

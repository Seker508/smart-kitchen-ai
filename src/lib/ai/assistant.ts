/**
 * Yapay zekâ mutfak asistanı.
 * - Kullanıcının envanterine yalnızca bu sunucu modülü üzerinden (kullanıcı kimliğiyle sınırlı) erişilir.
 * - Model, veritabanından seçilmiş aday tarif listesiyle beslenir ve yalnızca bu listeden "slug" seçebilir.
 * - Modelin önerdiği tarifler sunucuda doğrulanır; veritabanında olmayanlar "doğrulanmış tarif" gibi gösterilmez.
 * - Yapay zekâ yapılandırılmamışsa veya hata verirse, yanıt açıkça belirtilerek öneri algoritmasıyla üretilir.
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { ALLERGEN_LABELS } from "../constants";
import { daysUntil } from "../expiry";
import { recommend, type PantryItem, type SortKey } from "../recommend";
import { foldKey } from "../text";
import { loadCatalog } from "../services/catalog";
import { getAllInventory } from "../services/inventory";
import { filterByCategory, getPreferences, loadAllRecipes, toMatchPrefs, type RecipeCard } from "../services/recipes";
import { notFound } from "../api";
import { AiProviderError, extractJson, generate, getAiConfig, type ChatTurn } from "./provider";

export interface Intent {
  categories?: string[];
  maxMinutes?: number;
  sort: SortKey;
  mealPlan: boolean;
  statedIngredients: number[];
  expiringFocus: boolean;
}

/** Mesajdan basit niyet çıkarımı: kategori, süre, sıralama ve "evde X, Y var" gibi belirtilen malzemeler. */
export async function detectIntent(message: string): Promise<Intent> {
  const m = foldKey(message);
  const intent: Intent = { sort: "onerilen", mealPlan: false, statedIngredients: [], expiringFocus: false };
  const cats: string[] = [];
  if (/\btatli|tatlilar|desert|kek|kurabiye/.test(m)) cats.push("tatli");
  if (/corba/.test(m)) cats.push("corba");
  if (/kahvalti/.test(m)) cats.push("kahvaltilik");
  if (/salata/.test(m)) cats.push("salata");
  if (/aksam yemegi|ana yemek|ogle yemegi/.test(m)) cats.push("ana-yemek");
  if (/icecek/.test(m)) cats.push("icecek");
  if (/atistirma|meze/.test(m)) cats.push("atistirmalik");
  if (/borek|pogaca|hamur isi/.test(m)) cats.push("hamur-isi");
  if (/vejetaryen|etsiz/.test(m)) cats.push("vejetaryen");
  if (cats.length) intent.categories = cats;
  const min = m.match(/(\d{1,3})\s*(dk|dakika)/);
  if (min) intent.maxMinutes = Number(min[1]);
  else if (/pratik|hizli|cabuk/.test(m)) intent.maxMinutes = 30;
  if (/ekonomik|ucuz|butce/.test(m)) intent.sort = "ekonomik";
  if (/eksik/.test(m)) intent.sort = "eksik";
  if (/son kullanma|tarihi yaklas|bozulmadan|degerlendir/.test(m)) { intent.sort = "skt"; intent.expiringFocus = true; }
  if (/haftalik|yemek plani|menu|7 gun/.test(m)) intent.mealPlan = true;

  if (/\b(var|elimde|evde|mevcut)\b/.test(m)) {
    const { list } = await loadCatalog();
    const found = new Set<number>();
    for (const ing of list) {
      if (ing.alwaysAvailable) continue;
      for (const n of [ing.name, ...ing.aliases]) {
        const k = foldKey(n);
        if (k.length >= 2 && new RegExp(`(^|\\s)${k}(\\s|$|ler|lar|im|um)`).test(m)) { found.add(ing.id); break; }
      }
    }
    // Belirtilen malzemelerden en uzun eşleşmeyi tercih etmek için alt kümeleri temizlemeye gerek yok;
    // en az 2 malzeme belirtildiyse bunlar "varsayımsal envanter" olarak kullanılır.
    if (found.size >= 2) intent.statedIngredients = [...found];
  }
  return intent;
}

function candidateRecipes(all: RecipeCard[], pantry: PantryItem[], prefs: ReturnType<typeof toMatchPrefs>, intent: Intent) {
  const pool = filterByCategory(all, intent.categories);
  const { results } = recommend(pool, pantry, prefs, { sort: intent.sort === "onerilen" ? "eksik" : intent.sort, maxMinutes: intent.maxMinutes });
  return results.slice(0, intent.mealPlan ? 25 : 15);
}

const SYSTEM = `Sen "Smart Kitchen AI" uygulamasının Türkçe konuşan mutfak asistanısın. Samimi, kısa ve net cevaplar ver.
Kurallar:
1) Tarif önerirken YALNIZCA sana verilen ADAY TARİFLER listesindeki tarifleri öner ve bunların "slug" değerlerini recipeSlugs alanına yaz.
2) Listede olmayan bir fikir vermen gerekiyorsa açıkça "(uygulamadaki tarif veritabanında yok — genel öneri)" diye belirt ve slug uydurma.
3) Uyumluluk yüzdelerini ve eksik malzemeleri yalnızca verilen veriden aktar; kendin hesaplama yapma.
4) TARİHİ GEÇMİŞ ürünlerin tüketilmesini asla önerme; gerekiyorsa atılmaları/kontrol edilmeleri gerektiğini belirt.
5) Alerjen konusunda kesin güvence verme; kullanıcıdan etiketi kontrol etmesini iste.
6) Mutfak dışı konularda kibarca yalnızca mutfak konularında yardımcı olabileceğini söyle.
7) "reply" alanı Markdown biçiminde, en fazla ~180 kelime olsun. Haftalık plan istenirse gün gün kısa bir liste yap.
Çıktı biçimi: {"reply": string, "recipeSlugs": string[]}`;

const JSON_SCHEMA = {
  type: "object", additionalProperties: false, required: ["reply", "recipeSlugs"],
  properties: { reply: { type: "string" }, recipeSlugs: { type: "array", items: { type: "string" } } },
};

function buildContext(
  inventory: Awaited<ReturnType<typeof getAllInventory>>,
  prefs: Awaited<ReturnType<typeof getPreferences>>,
  candidates: ReturnType<typeof candidateRecipes>,
  intent: Intent,
) {
  const usable = inventory.filter((i) => { const d = daysUntil(i.expiresAt); return d == null || d >= 0; });
  const expired = inventory.filter((i) => { const d = daysUntil(i.expiresAt); return d != null && d < 0; });
  const fmtInv = usable.map((i) => {
    const d = daysUntil(i.expiresAt);
    return `- ${i.name}: ${i.quantity} ${i.unit.toLowerCase()}${d != null ? ` (SKT: ${d} gün)` : ""}`;
  }).join("\n") || "(envanter boş)";
  const prefList = [
    prefs.vegetarian && "vejetaryen", prefs.vegan && "vegan", prefs.glutenFree && "glutensiz", prefs.lactoseFree && "laktozsuz",
    prefs.lowBudget && "düşük bütçe", prefs.quickMeals && "pratik yemekler", prefs.healthy && "sağlıklı beslenme",
  ].filter(Boolean).join(", ") || "belirtilmemiş";
  const allergens = prefs.allergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(", ") || "yok";
  const cands = candidates.map(({ recipe: r, match: m }) =>
    `- slug=${r.slug} | ${r.title} | ${r.categorySlug} | ${r.totalMinutes} dk | uyum %${m.compatibility}` +
    ` | eksik: ${m.missing.map((x) => x.name).join(", ") || "yok"}${m.missingEssential ? " (ana malzeme eksik)" : ""}` +
    `${m.expiringUsed ? ` | SKT yaklaşan ${m.expiringUsed} ürün kullanır` : ""}`).join("\n") || "(uygun aday yok)";
  return `KULLANICI ENVANTERİ:\n${fmtInv}\n\nTARİHİ GEÇMİŞ (önerme!): ${expired.map((e) => e.name).join(", ") || "yok"}\n` +
    `TERCİHLER: ${prefList}\nALERJİLER: ${allergens}\n` +
    (intent.statedIngredients.length ? "NOT: Kullanıcı mesajında belirttiği malzemelere göre adaylar hesaplandı.\n" : "") +
    `\nADAY TARİFLER (uygulama veritabanından, uyumluluk sunucuda hesaplandı):\n${cands}`;
}

function fallbackReply(candidates: ReturnType<typeof candidateRecipes>, intent: Intent, reason: "no-ai" | "error") {
  const head = reason === "no-ai"
    ? "ℹ️ Yapay zekâ servisi yapılandırılmadığı için bu yanıt, uygulamanın **öneri algoritmasıyla** oluşturuldu."
    : "⚠️ Yapay zekâ servisine şu anda ulaşılamadı; bu yanıt **öneri algoritmasıyla** oluşturuldu.";
  if (!candidates.length) {
    return { reply: `${head}\n\nBu isteğe uygun bir tarif bulamadım. Envanterine malzeme eklemeyi ya da filtreyi genişletmeyi deneyebilirsin.`, slugs: [] };
  }
  if (intent.mealPlan) {
    const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    const mains = candidates.filter((c) => ["ana-yemek", "corba"].includes(c.recipe.categorySlug)).slice(0, 7);
    const pick = mains.length ? mains : candidates.slice(0, 7);
    const lines = pick.map((c, i) => `- **${days[i]}:** ${c.recipe.title} (uyum %${c.match.compatibility})`);
    return { reply: `${head}\n\nMalzemelerine göre bir haftalık plan önerisi:\n${lines.join("\n")}`, slugs: pick.map((c) => c.recipe.slug) };
  }
  const top = candidates.slice(0, 5);
  const lines = top.map(({ recipe: r, match: m }) =>
    `- **${r.title}** — uyum %${m.compatibility}, ${r.totalMinutes} dk` +
    (m.missing.length ? `; eksik: ${m.missing.map((x) => x.name).join(", ")}` : "; tüm malzemeler mevcut"));
  const intro = top[0].match.compatibility >= 50
    ? "Senin için en uygun tarifler:"
    : "Elindeki malzemelerle bu isteğe tam uyan bir tarif yok; en az eksikle yapabileceklerin şunlar (eksikleri tarif sayfasından tek tıkla alışveriş listene ekleyebilirsin):";
  return { reply: `${head}\n\n${intro}\n${lines.join("\n")}`, slugs: top.map((c) => c.recipe.slug) };
}

export async function getOrCreateSession(userId: string, sessionId: string | null | undefined, firstMessage: string) {
  if (sessionId) {
    const s = await db.query.chatSessions.findFirst({ where: and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)) });
    if (!s) throw notFound("Sohbet");
    return s;
  }
  const title = firstMessage.length > 60 ? `${firstMessage.slice(0, 57)}...` : firstMessage;
  const [s] = await db.insert(chatSessions).values({ userId, title }).returning();
  return s;
}

export async function chat(userId: string, sessionId: string | null | undefined, message: string) {
  const session = await getOrCreateSession(userId, sessionId, message);
  const history = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, session.id))
    .orderBy(desc(chatMessages.createdAt)).limit(10);
  await db.insert(chatMessages).values({ sessionId: session.id, role: "USER", content: message });

  const [all, inventory, prefsRow, intent] = await Promise.all([
    loadAllRecipes(), getAllInventory(userId), getPreferences(userId), detectIntent(message),
  ]);
  const prefs = toMatchPrefs(prefsRow);
  const pantry: PantryItem[] = intent.statedIngredients.length
    ? intent.statedIngredients.map((id) => ({ ingredientId: id, quantity: 1, unit: "ADET", expiresAt: null }))
    : inventory.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit, expiresAt: i.expiresAt }));
  const candidates = candidateRecipes(all, pantry, prefs, intent);
  const allowed = new Map(all.map((r) => [r.slug, r]));

  let reply: string, slugs: string[], mode: "ai" | "fallback";
  const config = getAiConfig();
  if (!config) {
    ({ reply, slugs } = fallbackReply(candidates, intent, "no-ai"));
    mode = "fallback";
  } else {
    try {
      const turns: ChatTurn[] = history.reverse().map((h) => ({ role: h.role === "USER" ? "user" : "assistant", content: h.content }));
      turns.push({ role: "user", content: `${buildContext(inventory, prefsRow, candidates, intent)}\n\nKULLANICI MESAJI: ${message}` });
      const { text } = await generate({ kind: "chat", system: SYSTEM, messages: turns, jsonSchema: { name: "assistant_reply", schema: JSON_SCHEMA }, maxTokens: 1200 }, config);
      const parsed = extractJson<{ reply?: unknown; recipeSlugs?: unknown }>(text);
      reply = typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim().slice(0, 4000) : "Üzgünüm, bir yanıt oluşturamadım.";
      slugs = Array.isArray(parsed.recipeSlugs) ? parsed.recipeSlugs.filter((s): s is string => typeof s === "string") : [];
      mode = "ai";
    } catch (e) {
      if (!(e instanceof AiProviderError)) console.error("[assistant]", e instanceof Error ? e.message : e);
      ({ reply, slugs } = fallbackReply(candidates, intent, "error"));
      mode = "fallback";
    }
  }
  // Doğrulama: yalnızca veritabanında var olan tarifler kart olarak gösterilir
  const recipeIds = [...new Set(slugs.map((s) => allowed.get(s)?.id).filter((x): x is number => x != null))].slice(0, 8);
  const [saved] = await db.insert(chatMessages).values({ sessionId: session.id, role: "ASSISTANT", content: reply, recipeIds, mode }).returning();
  await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, session.id));
  return { sessionId: session.id, message: await hydrateMessage(saved, all) };
}

type MsgRow = typeof chatMessages.$inferSelect;
async function hydrateMessage(m: MsgRow, all?: RecipeCard[]) {
  const list = all ?? (m.recipeIds.length ? await loadAllRecipes() : []);
  const byId = new Map(list.map((r) => [r.id, r]));
  return {
    id: m.id, role: m.role, content: m.content, mode: m.mode, createdAt: m.createdAt,
    recipes: m.recipeIds.map((id) => byId.get(id)).filter(Boolean).map((r) => ({
      id: r!.id, slug: r!.slug, title: r!.title, emoji: r!.emoji, totalMinutes: r!.totalMinutes, categorySlug: r!.categorySlug,
    })),
  };
}
export type ChatMessageView = Awaited<ReturnType<typeof hydrateMessage>>;

export async function listSessions(userId: string) {
  return db.select({ id: chatSessions.id, title: chatSessions.title, updatedAt: chatSessions.updatedAt })
    .from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)).limit(30);
}

export async function getSessionMessages(userId: string, sessionId: string) {
  const s = await db.query.chatSessions.findFirst({ where: and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)) });
  if (!s) throw notFound("Sohbet");
  const msgs = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(asc(chatMessages.createdAt));
  const all = await loadAllRecipes();
  return { session: { id: s.id, title: s.title }, messages: await Promise.all(msgs.map((m) => hydrateMessage(m, all))) };
}

export async function deleteSession(userId: string, sessionId: string) {
  const res = await db.delete(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))).returning();
  if (!res.length) throw notFound("Sohbet");
}

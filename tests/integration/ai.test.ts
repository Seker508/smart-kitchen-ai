/**
 * Yapay zekâ entegrasyon testleri.
 * NOT: Gerçek API anahtarı kullanılmaz. Sağlayıcıya giden HTTP isteği `fetch` mock'u ile yakalanır;
 * isteğin biçimi (model, görsel, JSON şeması) ve dönen yanıtın işlenmesi gerçek kodla test edilir.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { rm } from "node:fs/promises";
import { prepareDb, Client } from "../helpers";
import * as register from "@/app/api/auth/register/route";
import * as analyses from "@/app/api/image-analysis/route";
import * as analysis from "@/app/api/image-analysis/[id]/route";
import * as confirm from "@/app/api/image-analysis/[id]/confirm/route";
import * as image from "@/app/api/image-analysis/[id]/image/route";
import * as ingredients from "@/app/api/ingredients/route";
import * as chat from "@/app/api/ai/chat/route";
import * as session from "@/app/api/ai/sessions/[id]/route";
import { sniffImageType } from "@/lib/upload";
import { detectIntent } from "@/lib/ai/assistant";
import { extractJson } from "@/lib/ai/provider";

// 1x1 piksel geçerli PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

function pngForm(buf: Buffer = PNG, name = "buzdolabi.png", type = "image/png") {
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(buf)], name, { type }));
  return fd;
}

function mockOpenAI(content: unknown, capture?: (body: any) => void) {
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    capture?.(JSON.parse(String(init.body)));
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), { status: 200 });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("dosya doğrulama", () => {
  beforeAll(prepareDb);
  it("imza (magic bytes) ile tür tespiti", () => {
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(sniffImageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(Buffer.from("<script>alert(1)</script>"))).toBeNull();
  });
  it("model çıktısından JSON ayıklama", () => {
    expect(extractJson<{ a: number }>("```json\n{\"a\":1}\n```").a).toBe(1);
    expect(extractJson<{ a: number }>("Tabii! {\"a\":2} umarım yardımcı olur").a).toBe(2);
  });
  it("niyet çıkarımı", async () => {
    const i = await detectIntent("Evde yumurta, süt ve un var. 15 dakikada tatlı ne yapabilirim?");
    expect(i.categories).toContain("tatli");
    expect(i.maxMinutes).toBe(15);
    expect(i.statedIngredients.length).toBe(3);
    expect((await detectIntent("Son kullanma tarihi yaklaşan ürünlerimi nasıl değerlendirebilirim?")).sort).toBe("skt");
    expect((await detectIntent("Buzdolabımdaki ürünlerle haftalık yemek planı oluştur")).mealPlan).toBe(true);
  });
});

describe("fotoğrafla malzeme tanıma", () => {
  let c: Client;
  beforeAll(async () => {
    await prepareDb();
    await rm(process.env.UPLOAD_DIR!, { recursive: true, force: true });
    c = new Client();
    await c.call(register.POST, "POST", "/api/auth/register", { firstName: "Foto", lastName: "Test", email: "foto@example.com", password: "Sifre1234" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("API anahtarı yoksa anlaşılır uyarı verir (503) ve manuel ekleme çalışmaya devam eder", async () => {
    const r = await c.call(analyses.POST, "POST", "/api/image-analysis", pngForm());
    expect(r.status).toBe(503);
    expect(r.data.code).toBe("AI_NOT_CONFIGURED");
    const m = await c.call(ingredients.POST, "POST", "/api/ingredients", { name: "domates", quantity: 2, unit: "ADET" });
    expect(m.status).toBe(201);
  });

  it("geçersiz dosyaları reddeder (tür taklidi, uzantı, boyut)", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const fake = await c.call(analyses.POST, "POST", "/api/image-analysis", pngForm(Buffer.from("bu bir metin dosyasıdır....."), "foto.jpg", "image/jpeg"));
    expect(fake.status).toBe(415);
    const ext = await c.call(analyses.POST, "POST", "/api/image-analysis", pngForm(PNG, "foto.gif", "image/gif"));
    expect(ext.status).toBe(415);
    process.env.MAX_UPLOAD_MB = "1";
    const big = await c.call(analyses.POST, "POST", "/api/image-analysis", pngForm(Buffer.concat([PNG, Buffer.alloc(1.2 * 1024 * 1024)])));
    expect(big.status).toBe(413);
    delete process.env.MAX_UPLOAD_MB;
  });

  it("görseli modele gönderir, sonucu doğrular, katalogla eşleştirir; onaylananlar envantere eklenir", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    let sent: any;
    mockOpenAI({
      summary: "Buzdolabı rafı",
      items: [
        { name: "Yumurta", category: "sut-urunleri", confidence: 0.97, uncertain: false, alternatives: [], estimatedQuantity: 6, unit: "ADET" },
        { name: "süt", category: "sut-urunleri", confidence: 0.9, uncertain: false, alternatives: [], estimatedQuantity: null, unit: null },
        { name: "yeşil biber", category: "sebzeler", confidence: 0.82, uncertain: false, alternatives: [], estimatedQuantity: null, unit: null },
        { name: "beyaz peynir", category: "sut-urunleri", confidence: 0.48, uncertain: false, alternatives: ["lor peyniri"], estimatedQuantity: null, unit: null },
        { name: "belirsiz kavanoz", category: "diger", confidence: 0.1, uncertain: true, alternatives: [], estimatedQuantity: null, unit: null },
      ],
    }, (b) => (sent = b));

    const r = await c.call(analyses.POST, "POST", "/api/image-analysis", pngForm());
    expect(r.status).toBe(201);
    const a = r.data.analysis;
    expect(a.status).toBe("COMPLETED");
    // İstek biçimi: görsel base64 olarak ve JSON şemasıyla gönderilir
    expect(sent.model).toBe("gpt-4o-mini");
    expect(sent.response_format.type).toBe("json_schema");
    expect(sent.messages[1].content[1].image_url.url).toMatch(/^data:image\/png;base64,/);
    // Normalleştirme
    const names = a.detected.map((d: any) => d.name);
    expect(names).toEqual(["yumurta", "süt", "sivri biber", "beyaz peynir"]); // %10 güvenli olan elendi
    const cheese = a.detected.find((d: any) => d.name === "beyaz peynir");
    expect(cheese.uncertain).toBe(true); // < 0.6 → emin değil
    expect(cheese.alternatives).toEqual(["lor peyniri"]);
    expect(a.detected[0].estimatedQuantity).toBe(6);

    // Görsel yalnızca sahibine sunulur
    const img = await c.call(image.GET, "GET", `/api/image-analysis/${a.id}/image`, undefined, { id: a.id });
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/png");
    const stranger = new Client();
    await stranger.call(register.POST, "POST", "/api/auth/register", { firstName: "Baska", lastName: "Kisi", email: "baska@example.com", password: "Sifre1234" });
    expect((await stranger.call(image.GET, "GET", `/api/image-analysis/${a.id}/image`, undefined, { id: a.id })).status).toBe(404);
    expect((await stranger.call(analysis.GET, "GET", `/api/image-analysis/${a.id}`, undefined, { id: a.id })).status).toBe(404);

    // Kullanıcı düzenler: peyniri siler, adı değiştirir, eksik ürün ekler
    const ok = await c.call(confirm.POST, "POST", `/api/image-analysis/${a.id}/confirm`, {
      items: [
        { name: "yumurta", quantity: 6, unit: "ADET", storage: "BUZDOLABI" },
        { name: "süt", quantity: 1, unit: "LITRE", storage: "BUZDOLABI" },
        { name: "kapya biber", quantity: 2, unit: "ADET", storage: "BUZDOLABI" },
        { name: "yoğurt", quantity: 500, unit: "GRAM", storage: "BUZDOLABI" },
      ],
    }, { id: a.id });
    expect(ok.status).toBe(200);
    expect(ok.data.added).toBe(4);
    const inv = await c.call(ingredients.GET, "GET", "/api/ingredients?pageSize=50");
    expect(inv.data.items.filter((i: any) => i.source === "IMAGE").map((i: any) => i.name).sort())
      .toEqual(["kapya biber", "süt", "yoğurt", "yumurta"]);
    const again = await c.call(confirm.POST, "POST", `/api/image-analysis/${a.id}/confirm`, { items: [{ name: "su", quantity: 1, unit: "ADET" }] }, { id: a.id });
    expect(again.status).toBe(409);
  });

  it("sağlayıcı hata verirse analiz FAILED olur ve anlaşılır mesaj saklanır", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"error":{"message":"invalid key"}}', { status: 401 })));
    const r = await c.call(analyses.POST, "POST", "/api/image-analysis", pngForm());
    expect(r.data.analysis.status).toBe("FAILED");
    expect(r.data.analysis.error).toMatch(/API anahtarı geçersiz/);
  });
});

describe("yapay zekâ mutfak asistanı", () => {
  let c: Client;
  beforeAll(async () => {
    await prepareDb();
    c = new Client();
    await c.call(register.POST, "POST", "/api/auth/register", { firstName: "Asistan", lastName: "Test", email: "chat@example.com", password: "Sifre1234" });
    for (const [name, q, unit] of [["yumurta", 6, "ADET"], ["süt", 1, "LITRE"], ["un", 1, "KILOGRAM"], ["toz şeker", 1, "KILOGRAM"]] as const) {
      await c.call(ingredients.POST, "POST", "/api/ingredients", { name, quantity: q, unit });
    }
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
  });

  it("anahtar yokken yanıtı açıkça belirterek öneri algoritmasıyla üretir", async () => {
    const r = await c.call(chat.POST, "POST", "/api/ai/chat", { message: "Elimdeki malzemelerle tatlı öner" });
    expect(r.status).toBe(200);
    expect(r.data.message.mode).toBe("fallback");
    expect(r.data.message.content).toMatch(/öneri algoritmasıyla/);
    expect(r.data.message.recipes.length).toBeGreaterThan(0);
    expect(r.data.message.recipes.every((x: any) => x.categorySlug === "tatli")).toBe(true);
  });

  it("modele gerçek envanteri ve aday tarifleri gönderir; uydurulan slug'ları doğrulanmış tarif olarak göstermez", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    let sent: any;
    mockOpenAI({ reply: "Pankek ya da krep yapabilirsin! Ayrıca bir fikir: muzlu ekmek (veritabanında yok).", recipeSlugs: ["pankek", "krep", "uydurma-tarif-123"] }, (b) => (sent = b));
    const r = await c.call(chat.POST, "POST", "/api/ai/chat", { message: "Kahvaltı için ne yapabilirim?" });
    expect(r.data.message.mode).toBe("ai");
    expect(r.data.message.recipes.map((x: any) => x.slug)).toEqual(["pankek", "krep"]);
    const userTurn = sent.messages.at(-1).content as string;
    expect(userTurn).toMatch(/KULLANICI ENVANTERİ:[\s\S]*yumurta/);
    expect(userTurn).toMatch(/slug=pankek/);

    // Sohbet geçmişi kaydedilir ve sonraki mesajda modele iletilir
    let second: any;
    mockOpenAI({ reply: "Tabii.", recipeSlugs: [] }, (b) => (second = b));
    await c.call(chat.POST, "POST", "/api/ai/chat", { sessionId: r.data.sessionId, message: "Peki daha hızlısı?" });
    expect(second.messages.length).toBeGreaterThanOrEqual(4);
    const s = await c.call(session.GET, "GET", `/api/ai/sessions/${r.data.sessionId}`, undefined, { id: r.data.sessionId });
    expect(s.data.messages).toHaveLength(4);
  });

  it("başka kullanıcının sohbetine erişilemez", async () => {
    const r = await c.call(chat.POST, "POST", "/api/ai/chat", { message: "Merhaba" });
    const other = new Client();
    await other.call(register.POST, "POST", "/api/auth/register", { firstName: "Diger", lastName: "Kisi", email: "diger@example.com", password: "Sifre1234" });
    expect((await other.call(session.GET, "GET", `/api/ai/sessions/${r.data.sessionId}`, undefined, { id: r.data.sessionId })).status).toBe(404);
    expect((await other.call(chat.POST, "POST", "/api/ai/chat", { sessionId: r.data.sessionId, message: "selam" })).status).toBe(404);
  });

  it("servis hata verirse kullanıcıya bildirerek algoritmaya düşer", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 429 })));
    const r = await c.call(chat.POST, "POST", "/api/ai/chat", { message: "15 dakikada hazırlayabileceğim yemekler neler?" });
    expect(r.data.message.mode).toBe("fallback");
    expect(r.data.message.content).toMatch(/ulaşılamadı/);
  });
});

/**
 * Yapay zekâ sağlayıcı soyutlaması (OpenAI, Google Gemini, Anthropic).
 * Tüm çağrılar sunucu tarafında yapılır; API anahtarları yalnızca ortam değişkenlerinden okunur.
 */
export type ProviderName = "openai" | "gemini" | "anthropic";

export interface AiConfig {
  provider: ProviderName;
  apiKey: string;
  visionModel: string;
  chatModel: string;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("Yapay zekâ servisi yapılandırılmamış. .env dosyasına OPENAI_API_KEY, GEMINI_API_KEY veya ANTHROPIC_API_KEY ekleyin.");
  }
}

export class AiProviderError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export function getAiConfig(): AiConfig | null {
  const env = process.env;
  const candidates: Record<ProviderName, AiConfig | null> = {
    openai: env.OPENAI_API_KEY ? {
      provider: "openai", apiKey: env.OPENAI_API_KEY,
      visionModel: env.OPENAI_VISION_MODEL || "gpt-4o-mini", chatModel: env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    } : null,
    gemini: env.GEMINI_API_KEY ? {
      provider: "gemini", apiKey: env.GEMINI_API_KEY,
      visionModel: env.GEMINI_MODEL || "gemini-2.5-flash", chatModel: env.GEMINI_MODEL || "gemini-2.5-flash",
    } : null,
    anthropic: env.ANTHROPIC_API_KEY ? {
      provider: "anthropic", apiKey: env.ANTHROPIC_API_KEY,
      visionModel: env.ANTHROPIC_MODEL || "claude-haiku-4-5", chatModel: env.ANTHROPIC_MODEL || "claude-haiku-4-5",
    } : null,
  };
  const preferred = env.AI_PROVIDER as ProviderName | undefined;
  if (preferred && candidates[preferred]) return candidates[preferred];
  return candidates.openai ?? candidates.gemini ?? candidates.anthropic ?? null;
}

export function aiStatus() {
  const c = getAiConfig();
  return c ? { configured: true as const, provider: c.provider, visionModel: c.visionModel, chatModel: c.chatModel } : { configured: false as const };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateRequest {
  system: string;
  messages: ChatTurn[];
  image?: { base64: string; mimeType: string };
  /** JSON şeması (OpenAI structured outputs için). Diğer sağlayıcılarda JSON modu + istem kullanılır. */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  maxTokens?: number;
  kind: "vision" | "chat";
}

const TIMEOUT_MS = 60_000;

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      // Sağlayıcının hata gövdesi anahtar içermez; yine de yalnızca kısa bir özet tutulur
      const short = text.slice(0, 200).replace(/\s+/g, " ");
      const msg = res.status === 401 || res.status === 403
        ? "Yapay zekâ API anahtarı geçersiz veya yetkisiz."
        : res.status === 429 ? "Yapay zekâ servisinin kullanım limiti aşıldı. Biraz sonra tekrar deneyin."
          : `Yapay zekâ servisi hata döndürdü (${res.status}).`;
      console.error(`[ai] ${res.status}: ${short}`);
      throw new AiProviderError(msg, res.status);
    }
    return JSON.parse(text);
  } catch (e) {
    if (e instanceof AiProviderError) throw e;
    if ((e as Error).name === "AbortError") throw new AiProviderError("Yapay zekâ servisi zamanında yanıt vermedi.");
    throw new AiProviderError("Yapay zekâ servisine bağlanılamadı.");
  } finally {
    clearTimeout(t);
  }
}

/** Seçili sağlayıcıyla metin üretir ve modelin döndürdüğü ham metni verir. */
export async function generate(req: GenerateRequest, config = getAiConfig()): Promise<{ text: string; provider: ProviderName; model: string }> {
  if (!config) throw new AiNotConfiguredError();
  const model = req.kind === "vision" ? config.visionModel : config.chatModel;
  const maxTokens = req.maxTokens ?? 1500;

  if (config.provider === "openai") {
    const messages: unknown[] = [{ role: "system", content: req.system }];
    req.messages.forEach((m, i) => {
      const isLast = i === req.messages.length - 1;
      if (isLast && req.image && m.role === "user") {
        messages.push({ role: "user", content: [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: `data:${req.image.mimeType};base64,${req.image.base64}`, detail: "high" } },
        ] });
      } else messages.push(m);
    });
    const body: Record<string, unknown> = { model, messages, max_tokens: maxTokens, temperature: req.kind === "vision" ? 0.1 : 0.6 };
    body.response_format = req.jsonSchema
      ? { type: "json_schema", json_schema: { name: req.jsonSchema.name, schema: req.jsonSchema.schema, strict: true } }
      : { type: "json_object" };
    const data = await post("https://api.openai.com/v1/chat/completions", { authorization: `Bearer ${config.apiKey}` }, body);
    return { text: data?.choices?.[0]?.message?.content ?? "", provider: "openai", model };
  }

  if (config.provider === "gemini") {
    const contents = req.messages.map((m, i) => {
      const parts: unknown[] = [{ text: m.content }];
      if (i === req.messages.length - 1 && req.image) parts.push({ inline_data: { mime_type: req.image.mimeType, data: req.image.base64 } });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });
    const data = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      { "x-goog-api-key": config.apiKey },
      {
        systemInstruction: { parts: [{ text: req.system }] }, contents,
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens, temperature: req.kind === "vision" ? 0.1 : 0.6 },
      },
    );
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    return { text, provider: "gemini", model };
  }

  // anthropic
  const messages = req.messages.map((m, i) => {
    if (i === req.messages.length - 1 && req.image && m.role === "user") {
      return { role: "user", content: [
        { type: "image", source: { type: "base64", media_type: req.image.mimeType, data: req.image.base64 } },
        { type: "text", text: m.content },
      ] };
    }
    return m;
  });
  const data = await post(
    "https://api.anthropic.com/v1/messages",
    { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01" },
    { model, max_tokens: maxTokens, system: `${req.system}\n\nYanıtını yalnızca geçerli bir JSON nesnesi olarak ver.`, messages },
  );
  const text = (data?.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
  return { text, provider: "anthropic", model };
}

/** Model çıktısından ilk JSON nesnesini güvenle ayıklar (kod bloğu işaretleri vb. temizlenir). */
export function extractJson<T = unknown>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch { /* aşağıda hata */ }
    }
    throw new AiProviderError("Yapay zekâ yanıtı okunamadı (geçersiz JSON).");
  }
}

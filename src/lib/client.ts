"use client";
// İstemci tarafı API çağrıları için ortak yardımcı: hataları tek tip ApiClientError'a dönüştürür.

export class ApiClientError extends Error {
  constructor(message: string, public status: number, public code?: string, public fields?: Record<string, string>) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body || init.form ? "POST" : "GET"),
      headers: init.form ? undefined : init.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
      signal: init.signal,
      credentials: "same-origin",
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiClientError("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.", 0, "NETWORK");
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* boş gövde */ }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/")) {
      window.location.href = `/giris?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiClientError(data?.error ?? "İşlem başarısız oldu.", res.status, data?.code, data?.fields ?? data?.details?.fields);
  }
  return data as T;
}

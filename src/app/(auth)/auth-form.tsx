"use client";
import { useState } from "react";
import { ApiClientError } from "@/lib/client";

/** Form gönderimi için ortak durum: yükleniyor, alan hataları ve genel hata. */
export function useFormState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  async function run(fn: () => Promise<void>) {
    setLoading(true); setError(null); setFields({});
    try { await fn(); } catch (e) {
      if (e instanceof ApiClientError) { setError(e.message); setFields(e.fields ?? {}); }
      else setError("Beklenmeyen bir hata oluştu.");
    } finally { setLoading(false); }
  }
  return { loading, error, fields, run, setFields };
}

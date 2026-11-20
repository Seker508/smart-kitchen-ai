import { EXPIRY_SOON_DAYS, EXPIRY_URGENT_DAYS } from "./constants";

export type ExpiryStatus = "expired" | "urgent" | "soon" | "ok" | "none";

/** Yerel takvime göre gün farkı (saat diliminden bağımsız, YYYY-MM-DD karşılaştırması) */
export function daysUntil(dateStr: string | null | undefined, today: Date = new Date()): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - t) / 86_400_000);
}

export function expiryStatus(dateStr: string | null | undefined, today: Date = new Date()): ExpiryStatus {
  const n = daysUntil(dateStr, today);
  if (n == null) return "none";
  if (n < 0) return "expired";
  if (n <= EXPIRY_URGENT_DAYS) return "urgent";
  if (n <= EXPIRY_SOON_DAYS) return "soon";
  return "ok";
}

export function expiryLabel(dateStr: string | null | undefined, today: Date = new Date()): string {
  const n = daysUntil(dateStr, today);
  if (n == null) return "Tarih yok";
  if (n < 0) return `${-n} gün önce geçti`;
  if (n === 0) return "Bugün son gün";
  if (n === 1) return "Yarın son gün";
  return `${n} gün kaldı`;
}

export interface ExpiryGroups<T> {
  expired: T[];
  urgent: T[];
  soon: T[];
}

/**
 * Ürünleri üç gruba ayırır:
 *  - urgent: Öncelikli değerlendirilmesi gerekenler (0-2 gün)
 *  - soon: Son kullanma tarihi yaklaşanlar (3-7 gün)
 *  - expired: Tarihi geçmiş ürünler (tüketim önerisi yapılmaz)
 */
export function groupByExpiry<T extends { expiresAt: string | null }>(items: T[], today: Date = new Date()): ExpiryGroups<T> {
  const g: ExpiryGroups<T> = { expired: [], urgent: [], soon: [] };
  for (const it of items) {
    const st = expiryStatus(it.expiresAt, today);
    if (st === "expired") g.expired.push(it);
    else if (st === "urgent") g.urgent.push(it);
    else if (st === "soon") g.soon.push(it);
  }
  const byDate = (a: T, b: T) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? "");
  g.expired.sort(byDate); g.urgent.sort(byDate); g.soon.sort(byDate);
  return g;
}

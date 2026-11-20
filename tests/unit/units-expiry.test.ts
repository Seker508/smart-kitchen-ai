import { describe, expect, it } from "vitest";
import { convert, formatQuantity, scaleQuantity } from "@/lib/units";
import { daysUntil, expiryStatus, groupByExpiry } from "@/lib/expiry";
import { foldKey, slugify } from "@/lib/text";

describe("birim dönüşümü", () => {
  it("hacim ve kütle", () => {
    expect(convert(1, "SU_BARDAGI", "MILILITRE")).toBe(200);
    expect(convert(2, "KILOGRAM", "GRAM")).toBe(2000);
    expect(convert(3, "YEMEK_KASIGI", "CAY_KASIGI")).toBe(9);
  });
  it("yoğunluk bilinen malzemede kütle↔hacim", () => {
    expect(convert(1, "SU_BARDAGI", "GRAM", { slug: "un" })).toBeCloseTo(120);
    expect(convert(1, "SU_BARDAGI", "GRAM", { slug: "bilinmeyen" })).toBeNull();
  });
  it("adet↔gram", () => {
    expect(convert(2, "ADET", "GRAM", { gramsPerPiece: 150 })).toBe(300);
    expect(convert(300, "GRAM", "ADET", { gramsPerPiece: 150 })).toBe(2);
    expect(convert(1, "DEMET", "GRAM")).toBeNull();
  });
  it("biçimlendirme ve ölçekleme", () => {
    expect(formatQuantity(0.5)).toBe("½");
    expect(formatQuantity(1.25)).toBe("1¼");
    expect(formatQuantity(3)).toBe("3");
    expect(scaleQuantity(2, 4, 6)).toBe(3);
  });
});

describe("son kullanma tarihi", () => {
  const today = new Date(2026, 10, 20);
  it("gün farkı ve durum", () => {
    expect(daysUntil("2026-11-20", today)).toBe(0);
    expect(expiryStatus("2026-11-19", today)).toBe("expired");
    expect(expiryStatus("2026-11-22", today)).toBe("urgent");
    expect(expiryStatus("2026-11-26", today)).toBe("soon");
    expect(expiryStatus("2026-12-30", today)).toBe("ok");
    expect(expiryStatus(null, today)).toBe("none");
  });
  it("üç grup", () => {
    const g = groupByExpiry([{ expiresAt: "2026-11-18" }, { expiresAt: "2026-11-21" }, { expiresAt: "2026-11-25" }, { expiresAt: null }], today);
    expect([g.expired.length, g.urgent.length, g.soon.length]).toEqual([1, 1, 1]);
  });
});

describe("metin", () => {
  it("Türkçe slug", () => {
    expect(slugify("İrmik Helvası")).toBe("irmik-helvasi");
    expect(foldKey("  Şekerpare ")).toBe("sekerpare");
  });
});

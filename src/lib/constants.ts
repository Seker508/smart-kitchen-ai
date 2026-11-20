// İstemci ve sunucu tarafında paylaşılan sabitler
import type { Difficulty, StorageArea, Unit } from "@/db/schema";

export const UNITS: Unit[] = [
  "ADET", "GRAM", "KILOGRAM", "MILILITRE", "LITRE", "YEMEK_KASIGI", "TATLI_KASIGI", "CAY_KASIGI",
  "SU_BARDAGI", "CAY_BARDAGI", "PAKET", "DEMET", "DIS", "TUTAM", "DILIM",
];

export const UNIT_LABELS: Record<Unit, string> = {
  ADET: "adet", GRAM: "g", KILOGRAM: "kg", MILILITRE: "ml", LITRE: "L",
  YEMEK_KASIGI: "yemek kaşığı", TATLI_KASIGI: "tatlı kaşığı", CAY_KASIGI: "çay kaşığı",
  SU_BARDAGI: "su bardağı", CAY_BARDAGI: "çay bardağı", PAKET: "paket", DEMET: "demet",
  DIS: "diş", TUTAM: "tutam", DILIM: "dilim",
};

export const STORAGE_AREAS: StorageArea[] = ["BUZDOLABI", "DONDURUCU", "MUTFAK_DOLABI", "DIGER"];
export const STORAGE_LABELS: Record<StorageArea, string> = {
  BUZDOLABI: "Buzdolabı", DONDURUCU: "Dondurucu", MUTFAK_DOLABI: "Mutfak dolabı", DIGER: "Diğer",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { KOLAY: "Kolay", ORTA: "Orta", ZOR: "Zor" };

export const ALLERGEN_LABELS: Record<string, string> = {
  gluten: "Gluten", sut: "Süt", yumurta: "Yumurta", "kabuklu-yemis": "Kabuklu yemiş",
  "yer-fistigi": "Yer fıstığı", soya: "Soya", balik: "Balık", "kabuklu-deniz": "Kabuklu deniz ürünü",
  susam: "Susam", hardal: "Hardal", kereviz: "Kereviz",
};
export const ALLERGEN_CODES = Object.keys(ALLERGEN_LABELS);

export const INGREDIENT_CATEGORY_LABELS: Record<string, string> = {
  sebzeler: "Sebzeler", meyveler: "Meyveler", "et-tavuk": "Et, Tavuk ve Balık",
  "sut-urunleri": "Süt Ürünleri ve Yumurta", bakliyat: "Bakliyatlar", tahillar: "Tahıllar",
  baharatlar: "Baharatlar", icecekler: "İçecekler", yaglar: "Yağlar", "unlu-mamuller": "Unlu Mamuller", diger: "Diğer",
};
export const INGREDIENT_CATEGORY_SLUGS = Object.keys(INGREDIENT_CATEGORY_LABELS);

export const RECIPE_CATEGORY_LABELS: Record<string, string> = {
  "ana-yemek": "Ana Yemek", corba: "Çorba", tatli: "Tatlı", kahvaltilik: "Kahvaltılık",
  atistirmalik: "Atıştırmalık", salata: "Salata", "hamur-isi": "Hamur İşi", icecek: "İçecek",
  vejetaryen: "Vejetaryen", pratik: "Pratik",
};

/** Kategoriye göre illüstrasyon renkleri (kart görselleri için) */
export const RECIPE_CATEGORY_TINTS: Record<string, { bg: string; plate: string; ring: string }> = {
  "ana-yemek": { bg: "#F4E3CF", plate: "#FFF8EE", ring: "#E7C9A5" },
  corba: { bg: "#F6DCC6", plate: "#FFF6EC", ring: "#EBBE98" },
  tatli: { bg: "#F3DDE0", plate: "#FFF5F6", ring: "#E6BFC5" },
  kahvaltilik: { bg: "#F7EBC5", plate: "#FFFBEA", ring: "#EBD58F" },
  atistirmalik: { bg: "#E6EDD5", plate: "#FAFDF2", ring: "#C9D7A8" },
  salata: { bg: "#DCEBD6", plate: "#F6FCF3", ring: "#B5D3A9" },
  "hamur-isi": { bg: "#EFE2CC", plate: "#FFF9EF", ring: "#DCC39A" },
  icecek: { bg: "#D9E8EC", plate: "#F3FAFC", ring: "#AFCDD6" },
};

export const EXPIRY_SOON_DAYS = 7; // "Son kullanma tarihi yaklaşanlar"
export const EXPIRY_URGENT_DAYS = 2; // "Öncelikli değerlendirilmesi gerekenler"

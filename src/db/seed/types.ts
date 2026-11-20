/**
 * Tarif seed verisi için kompakt format.
 * Malzeme: [ad, miktar | null, birim | null, bayraklar?, not?]
 *   bayraklar: "e" = ana (zorunlu) malzeme, "o" = isteğe bağlı
 * Birim kısaltmaları: adet, g, kg, ml, l, yk (yemek kaşığı), tk (tatlı kaşığı), ck (çay kaşığı),
 *   sb (su bardağı), cb (çay bardağı), pk (paket), demet, dis (diş), tutam, dilim
 */
export type U = "adet" | "g" | "kg" | "ml" | "l" | "yk" | "tk" | "ck" | "sb" | "cb" | "pk" | "demet" | "dis" | "tutam" | "dilim";
export type Ing = [name: string, qty: number | null, unit: U | null, flags?: "" | "e" | "o", note?: string];

export interface RecipeSeed {
  t: string; // başlık
  c: "ana-yemek" | "corba" | "tatli" | "kahvaltilik" | "atistirmalik" | "salata" | "hamur-isi" | "icecek";
  e: string; // emoji (görsel illüstrasyon için)
  d: string; // açıklama
  p: number; // hazırlık (dk)
  k: number; // pişirme (dk)
  s: number; // porsiyon
  z: "KOLAY" | "ORTA" | "ZOR";
  i: Ing[];
  st: string[];
}

export const UNIT_MAP = {
  adet: "ADET", g: "GRAM", kg: "KILOGRAM", ml: "MILILITRE", l: "LITRE", yk: "YEMEK_KASIGI",
  tk: "TATLI_KASIGI", ck: "CAY_KASIGI", sb: "SU_BARDAGI", cb: "CAY_BARDAGI", pk: "PAKET",
  demet: "DEMET", dis: "DIS", tutam: "TUTAM", dilim: "DILIM",
} as const;

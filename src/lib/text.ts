const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** Türkçe karakter duyarlı küçük harfe çevirme ve boşluk temizleme */
export function normalizeName(input: string): string {
  return input.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

/** Arama/eşleştirme için aksan ve Türkçe karakterlerden arındırılmış anahtar */
export function foldKey(input: string): string {
  return normalizeName(input)
    .replace(/[çğıİöşüâîû]/g, (ch) => TR_MAP[ch] ?? ch)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "").trim();
}

export function slugify(input: string): string {
  return foldKey(input).replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1) : s;
}

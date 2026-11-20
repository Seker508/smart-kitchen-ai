import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || "http://localhost:3000";
  return ["", "/giris", "/kayit"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p ? 0.5 : 1 }));
}

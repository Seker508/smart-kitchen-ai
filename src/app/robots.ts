import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL || "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: ["/", "/giris", "/kayit"], disallow: ["/api/", "/panel", "/envanter", "/fotograf", "/asistan"] }], sitemap: `${base}/sitemap.xml` };
}

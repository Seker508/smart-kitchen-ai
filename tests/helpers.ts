import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb } from "@/db";
import { seedCatalog, seedRecipes } from "@/db/seed";
import { resetRateLimits } from "@/lib/api";
import { clearCatalogCache } from "@/lib/services/catalog";
import { clearRecipeCache } from "@/lib/services/recipes";

let prepared = false;

/** Test veritabanını migrate eder, katalog ve tarifleri yükler, kullanıcı verilerini temizler. */
export async function prepareDb() {
  const db = getDb();
  if (!prepared) {
    await migrate(db, { migrationsFolder: "./drizzle" });
    await seedCatalog(db);
    await seedRecipes(db);
    prepared = true;
  }
  await db.execute(sql`truncate table users cascade`);
  clearCatalogCache();
  clearRecipeCache();
  resetRateLimits();
}

const BASE = "http://localhost:3000";

type Handler = (req: Request, ctx: { params: Promise<any> }) => Promise<Response>;

export class Client {
  cookie = "";
  async call(handler: Handler, method: string, path: string, body?: unknown, params: Record<string, string> = {}) {
    const headers: Record<string, string> = { host: "localhost:3000" };
    if (this.cookie) headers.cookie = this.cookie;
    let payload: BodyInit | undefined;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    const res = await handler(new Request(BASE + path, { method, headers, body: payload }), { params: Promise.resolve(params) });
    const set = res.headers.get("set-cookie");
    if (set) {
      const m = set.match(/sk_session=([^;]*)/);
      if (m) this.cookie = m[1] ? `sk_session=${m[1]}` : "";
    }
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  }
}

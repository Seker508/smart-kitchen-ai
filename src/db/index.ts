import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __skPool?: Pool; __skDb?: DB };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil. .env dosyasını kontrol edin.");
  return new Pool({ connectionString: url, max: 10 });
}

/** Tekil (singleton) veritabanı bağlantısı — geliştirme modunda hot-reload sırasında yeniden kullanılır. */
export function getDb(): DB {
  if (!globalForDb.__skDb) {
    globalForDb.__skPool = createPool();
    globalForDb.__skDb = drizzle(globalForDb.__skPool, { schema });
  }
  return globalForDb.__skDb;
}

export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export async function closeDb() {
  await globalForDb.__skPool?.end();
  globalForDb.__skPool = undefined;
  globalForDb.__skDb = undefined;
}

export { schema };

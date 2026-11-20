// .env dosyası varsa yükle; yoksa (ör. Railway) ortam değişkenleri zaten tanımlıdır
try { process.loadEnvFile(".env"); } catch { /* .env yok */ }
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, getDb } from "./index";

async function main() {
  console.log("➜ Migration'lar uygulanıyor...");
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
  console.log("✓ Veritabanı şeması güncel.");
  await closeDb();
}

main().catch(async (e) => {
  console.error("✗ Migration hatası:", e instanceof Error ? e.message : e);
  await closeDb();
  process.exit(1);
});

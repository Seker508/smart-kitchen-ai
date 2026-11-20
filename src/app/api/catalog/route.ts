import { json, requireUser, route } from "@/lib/api";
import { searchCatalog } from "@/lib/services/catalog";

export const GET = route(async (req) => {
  await requireUser(req);
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  const items = await searchCatalog(q, 10);
  return json({
    items: items.map((i) => ({ id: i.id, name: i.name, categorySlug: i.categorySlug, defaultUnit: i.defaultUnit, allergens: i.allergens })),
  });
});

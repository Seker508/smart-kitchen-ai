import { z } from "zod";
import { json, parseQuery, route } from "@/lib/api";
import { listRecipes } from "@/lib/services/recipes";

const q = z.object({
  q: z.string().trim().max(60).optional(),
  category: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});

// Tarif listesi herkese açıktır (tanıtım sayfasındaki örnek kartlar için); kişisel veri içermez.
export const GET = route(async (req) => json(await listRecipes(parseQuery(req, q))));

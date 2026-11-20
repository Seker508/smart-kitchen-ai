import { json, parseJson, requireUser, route } from "@/lib/api";
import { recommendForUser } from "@/lib/services/recipes";
import { recommendSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const p = await parseJson(req, recommendSchema);
  const categories = p.categories ?? (p.category ? [p.category] : undefined);
  return json(await recommendForUser(user.id, { ...p, categories }));
});

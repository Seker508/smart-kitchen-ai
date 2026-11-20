import { json, parseJson, parseQuery, requireUser, route } from "@/lib/api";
import { addIngredient, listInventory } from "@/lib/services/inventory";
import { ingredientInputSchema, inventoryQuerySchema } from "@/lib/validation";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await listInventory(user.id, parseQuery(req, inventoryQuerySchema)));
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const input = await parseJson(req, ingredientInputSchema);
  const res = await addIngredient(user.id, input);
  return json({ ...res, message: res.merged ? `${res.item.name} zaten vardı; miktar güncellendi.` : `${res.item.name} envantere eklendi.` }, res.merged ? 200 : 201);
});

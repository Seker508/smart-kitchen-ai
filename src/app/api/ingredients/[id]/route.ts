import { json, parseJson, requireUser, route } from "@/lib/api";
import { deleteIngredient, getItem, updateIngredient } from "@/lib/services/inventory";
import { ingredientUpdateSchema } from "@/lib/validation";

type P = { id: string };

export const GET = route<P>(async (req, { params }) => {
  const user = await requireUser(req);
  return json({ item: await getItem(user.id, (await params).id) });
});

export const PUT = route<P>(async (req, { params }) => {
  const user = await requireUser(req);
  const patch = await parseJson(req, ingredientUpdateSchema);
  return json({ item: await updateIngredient(user.id, (await params).id, patch) });
});

export const DELETE = route<P>(async (req, { params }) => {
  const user = await requireUser(req);
  await deleteIngredient(user.id, (await params).id);
  return json({ ok: true });
});

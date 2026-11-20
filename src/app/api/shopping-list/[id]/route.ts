import { json, parseJson, requireUser, route } from "@/lib/api";
import { deleteShoppingItem, updateShoppingItem } from "@/lib/services/shopping";
import { shoppingUpdateSchema } from "@/lib/validation";

type P = { id: string };

export const PATCH = route<P>(async (req, { params }) => {
  const user = await requireUser(req);
  await updateShoppingItem(user.id, (await params).id, await parseJson(req, shoppingUpdateSchema));
  return json({ ok: true });
});

export const DELETE = route<P>(async (req, { params }) => {
  const user = await requireUser(req);
  await deleteShoppingItem(user.id, (await params).id);
  return json({ ok: true });
});

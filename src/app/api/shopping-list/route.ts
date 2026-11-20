import { json, parseJson, requireUser, route } from "@/lib/api";
import { addShoppingItem, listShopping } from "@/lib/services/shopping";
import { shoppingItemSchema } from "@/lib/validation";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await listShopping(user.id));
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const input = await parseJson(req, shoppingItemSchema);
  const res = await addShoppingItem(user.id, input);
  return json({ ...res, message: res.merged ? "Ürün listede vardı; miktar birleştirildi." : "Ürün listeye eklendi." }, res.merged ? 200 : 201);
});

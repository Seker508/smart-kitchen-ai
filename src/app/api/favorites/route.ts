import { z } from "zod";
import { json, parseJson, requireUser, route } from "@/lib/api";
import { addFavorite, listFavorites } from "@/lib/services/favorites";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json({ items: await listFavorites(user.id) });
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { recipeId } = await parseJson(req, z.object({ recipeId: z.number().int().positive() }));
  await addFavorite(user.id, recipeId);
  return json({ ok: true }, 201);
});

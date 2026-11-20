import { ApiError, json, requireUser, route } from "@/lib/api";
import { removeFavorite } from "@/lib/services/favorites";

export const DELETE = route<{ recipeId: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const id = Number((await params).recipeId);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Geçersiz tarif kimliği.");
  await removeFavorite(user.id, id);
  return json({ ok: true });
});

import { json, parseJson, requireUser, route } from "@/lib/api";
import { addMissingFromRecipe } from "@/lib/services/shopping";
import { fromRecipeSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { recipeId, servings } = await parseJson(req, fromRecipeSchema);
  const res = await addMissingFromRecipe(user.id, recipeId, servings);
  return json({
    ...res,
    message: res.added.length ? `${res.added.length} eksik malzeme listeye eklendi.` : "Bu tarif için eksik malzemen yok.",
  });
});

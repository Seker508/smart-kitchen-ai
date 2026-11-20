import { json, getUserFromRequest, route } from "@/lib/api";
import { getRecipeDetail } from "@/lib/services/recipes";

export const GET = route<{ slug: string }>(async (req, { params }) => {
  const user = await getUserFromRequest(req);
  return json({ recipe: await getRecipeDetail((await params).slug, user?.id) });
});

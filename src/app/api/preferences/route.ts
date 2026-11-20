import { json, parseJson, requireUser, route } from "@/lib/api";
import { getPreferences } from "@/lib/services/recipes";
import { updatePreferences } from "@/lib/services/users";
import { preferencesSchema } from "@/lib/validation";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json({ preferences: await getPreferences(user.id) });
});

export const PUT = route(async (req) => {
  const user = await requireUser(req);
  const input = await parseJson(req, preferencesSchema);
  // Vegan tercih, vejetaryenliği de kapsar
  await updatePreferences(user.id, { ...input, vegetarian: input.vegetarian || input.vegan, allergyNotes: input.allergyNotes ?? null });
  return json({ preferences: await getPreferences(user.id) });
});

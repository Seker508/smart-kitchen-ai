import { json, requireUser, route } from "@/lib/api";
import { getExpiryOverview } from "@/lib/services/dashboard";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await getExpiryOverview(user.id));
});

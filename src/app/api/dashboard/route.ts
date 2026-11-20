import { json, requireUser, route } from "@/lib/api";
import { getDashboard } from "@/lib/services/dashboard";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json(await getDashboard(user.id));
});

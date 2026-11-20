import { json, requireUser, route } from "@/lib/api";
import { listSessions } from "@/lib/ai/assistant";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json({ items: await listSessions(user.id) });
});

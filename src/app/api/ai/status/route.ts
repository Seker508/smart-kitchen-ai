import { json, requireUser, route } from "@/lib/api";
import { aiStatus } from "@/lib/ai/provider";

export const GET = route(async (req) => {
  await requireUser(req);
  return json(aiStatus());
});

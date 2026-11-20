import { json, parseJson, rateLimit, requireUser, route } from "@/lib/api";
import { chat } from "@/lib/ai/assistant";
import { chatSchema } from "@/lib/validation";

export const maxDuration = 60;

export const POST = route(async (req) => {
  const user = await requireUser(req);
  rateLimit(`chat:${user.id}`, 30, 10 * 60_000);
  const { sessionId, message } = await parseJson(req, chatSchema);
  return json(await chat(user.id, sessionId, message));
});

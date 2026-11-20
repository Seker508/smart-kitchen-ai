import { json, requireUser, route } from "@/lib/api";
import { deleteSession, getSessionMessages } from "@/lib/ai/assistant";

type P = { id: string };

export const GET = route<P>(async (req, { params }) => {
  const user = await requireUser(req);
  return json(await getSessionMessages(user.id, (await params).id));
});

export const DELETE = route<P>(async (req, { params }) => {
  const user = await requireUser(req);
  await deleteSession(user.id, (await params).id);
  return json({ ok: true });
});

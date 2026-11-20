import { json, requireUser, route } from "@/lib/api";
import { getAnalysis } from "@/lib/services/analysis";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  return json({ analysis: await getAnalysis(user.id, (await params).id) });
});

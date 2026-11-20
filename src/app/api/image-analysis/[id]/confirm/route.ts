import { json, parseJson, requireUser, route } from "@/lib/api";
import { confirmAnalysis } from "@/lib/services/analysis";
import { confirmAnalysisSchema } from "@/lib/validation";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const { items } = await parseJson(req, confirmAnalysisSchema);
  const res = await confirmAnalysis(user.id, (await params).id, items);
  return json({ ok: true, ...res, message: `${res.added} ürün eklendi, ${res.merged} ürünün miktarı güncellendi.` });
});

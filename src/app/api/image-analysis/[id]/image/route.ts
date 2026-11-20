import { requireUser, route } from "@/lib/api";
import { getAnalysis } from "@/lib/services/analysis";
import { readUpload } from "@/lib/upload";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const a = await getAnalysis(user.id, (await params).id); // sahiplik kontrolü
  const buf = await readUpload(user.id, a.id, a.mimeType);
  return new Response(new Uint8Array(buf), {
    headers: { "content-type": a.mimeType, "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff" },
  });
});

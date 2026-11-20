import { ApiError, json, rateLimit, requireUser, route } from "@/lib/api";
import { createAnalysis, listAnalyses } from "@/lib/services/analysis";
import { validateImageFile } from "@/lib/upload";

export const maxDuration = 90;

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return json({ items: await listAnalyses(user.id) });
});

export const POST = route(async (req) => {
  const user = await requireUser(req);
  rateLimit(`vision:${user.id}`, 20, 60 * 60_000);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "Dosya yüklenemedi. Lütfen tekrar deneyin.", "BAD_FORM");
  }
  const file = await validateImageFile(form.get("file") as File | null);
  const analysis = await createAnalysis(user.id, file);
  return json({ analysis }, 201);
});

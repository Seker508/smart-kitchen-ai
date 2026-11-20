import { z } from "zod";
import { json, parseJson, requireUser, route } from "@/lib/api";
import { clearPurchased, movePurchasedToInventory } from "@/lib/services/shopping";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const { action } = await parseJson(req, z.object({ action: z.enum(["clear-purchased", "move-to-inventory"]) }));
  if (action === "clear-purchased") {
    const n = await clearPurchased(user.id);
    return json({ ok: true, message: `${n} ürün listeden kaldırıldı.` });
  }
  const r = await movePurchasedToInventory(user.id);
  return json({
    ok: true,
    message: `${r.moved} ürün envantere aktarıldı.${r.skipped ? ` ${r.skipped} ürünün miktarı olmadığı için aktarılmadı.` : ""}`,
  });
});

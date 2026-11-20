import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { aiStatus } from "@/lib/ai/provider";
import { listAnalyses } from "@/lib/services/analysis";
import { UploadView } from "./upload-view";

export const metadata: Metadata = { title: "Fotoğrafla Ürün Tanıma" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requirePageUser();
  const [ai, recent] = await Promise.all([Promise.resolve(aiStatus()), listAnalyses(user.id, 6)]);
  return <UploadView ai={ai} recent={recent.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />;
}

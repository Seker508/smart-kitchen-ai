import type { Metadata } from "next";
import { aiStatus } from "@/lib/ai/provider";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Ayarlar" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <SettingsView ai={aiStatus()} />;
}

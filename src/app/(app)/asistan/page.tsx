import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { aiStatus } from "@/lib/ai/provider";
import { listSessions } from "@/lib/ai/assistant";
import { ChatView } from "./chat-view";

export const metadata: Metadata = { title: "Yapay Zekâ Mutfak Asistanı" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requirePageUser();
  const sessions = await listSessions(user.id);
  return <ChatView ai={aiStatus()} initialSessions={sessions.map((s) => ({ ...s, updatedAt: s.updatedAt.toISOString() }))} firstName={user.firstName} />;
}

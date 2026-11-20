import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { getPreferences } from "@/lib/services/recipes";
import { inventoryStats } from "@/lib/services/inventory";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profilim" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requirePageUser();
  const [prefs, stats] = await Promise.all([getPreferences(user.id), inventoryStats(user.id)]);
  const { vegetarian, vegan, glutenFree, lactoseFree, lowBudget, quickMeals, healthy, allergens, allergyNotes } = prefs;
  return <ProfileView user={{ ...user, createdAt: user.createdAt.toISOString() }} stats={stats}
    prefs={{ vegetarian, vegan, glutenFree, lactoseFree, lowBudget, quickMeals, healthy, allergens, allergyNotes: allergyNotes ?? "" }} />;
}

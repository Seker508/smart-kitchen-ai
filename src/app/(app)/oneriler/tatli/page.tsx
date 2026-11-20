import type { Metadata } from "next";
import { RecommendationsView } from "@/components/recipes/recommendations-view";

export const metadata: Metadata = { title: "Tatlı Önerileri" };

export default function Page() {
  return <RecommendationsView eyebrow="Öneriler" title="Tatlı önerileri" description="Sütlü tatlılardan şerbetlilere, kurabiyelerden keklere — elindekilerle yapabileceğin tatlılar."
    tabs={[{ key: "tatli", label: "Tatlılar", categories: ["tatli"] }]} />;
}

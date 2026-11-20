import type { Metadata } from "next";
import { RecommendationsView } from "@/components/recipes/recommendations-view";

export const metadata: Metadata = { title: "Çorba ve Kahvaltılık Önerileri" };

export default function Page() {
  return <RecommendationsView eyebrow="Öneriler" title="Çorba ve kahvaltılık önerileri" description="Güne güzel bir kahvaltıyla başla, akşamı sıcak bir çorbayla tamamla."
    tabs={[
      { key: "hepsi", label: "Tümü", categories: ["corba", "kahvaltilik"] },
      { key: "corba", label: "Çorbalar", categories: ["corba"] },
      { key: "kahvalti", label: "Kahvaltılıklar", categories: ["kahvaltilik"] },
      { key: "icecek", label: "İçecekler", categories: ["icecek"] },
    ]} />;
}

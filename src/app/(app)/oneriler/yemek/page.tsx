import type { Metadata } from "next";
import { RecommendationsView } from "@/components/recipes/recommendations-view";

export const metadata: Metadata = { title: "Yemek Önerileri" };

export default function Page() {
  return <RecommendationsView eyebrow="Öneriler" title="Yemek önerileri" description="Ana yemekler, salatalar ve hamur işleri — mutfağındaki malzemelerle uyumuna göre sıralandı."
    tabs={[
      { key: "hepsi", label: "Tümü", categories: ["ana-yemek", "salata", "hamur-isi", "atistirmalik"] },
      { key: "ana", label: "Ana yemekler", categories: ["ana-yemek"] },
      { key: "salata", label: "Salatalar", categories: ["salata"] },
      { key: "hamur", label: "Hamur işleri", categories: ["hamur-isi"] },
      { key: "atistirma", label: "Atıştırmalıklar", categories: ["atistirmalik"] },
      { key: "vejetaryen", label: "Vejetaryen", categories: ["vejetaryen"] },
    ]} />;
}

import type { Metadata } from "next";
import { RecommendationsView } from "@/components/recipes/recommendations-view";
import type { SortKey } from "@/lib/recommend";

export const metadata: Metadata = { title: "Tüm Tarifler" };

const SORTS = ["onerilen", "uyum", "eksik", "sure", "ekonomik", "skt"];

export default async function Page({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  return <RecommendationsView eyebrow="Tarifler" title="Tüm tarifler" description="Veritabanındaki tüm tarifler, senin mutfağınla karşılaştırılarak."
    initialSort={(SORTS.includes(sort ?? "") ? sort : "onerilen") as SortKey}
    tabs={[
      { key: "hepsi", label: "Tümü" },
      { key: "ana-yemek", label: "Ana yemekler", categories: ["ana-yemek"] },
      { key: "corba", label: "Çorbalar", categories: ["corba"] },
      { key: "tatli", label: "Tatlılar", categories: ["tatli"] },
      { key: "kahvaltilik", label: "Kahvaltılıklar", categories: ["kahvaltilik"] },
      { key: "atistirmalik", label: "Atıştırmalıklar", categories: ["atistirmalik"] },
      { key: "salata", label: "Salatalar", categories: ["salata"] },
      { key: "hamur-isi", label: "Hamur işleri", categories: ["hamur-isi"] },
      { key: "icecek", label: "İçecekler", categories: ["icecek"] },
      { key: "vejetaryen", label: "Vejetaryen", categories: ["vejetaryen"] },
      { key: "pratik", label: "Pratik (≤30 dk)", categories: ["pratik"] },
    ]} />;
}

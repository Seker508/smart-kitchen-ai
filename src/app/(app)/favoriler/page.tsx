import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { requirePageUser } from "@/lib/auth/session";
import { listFavorites } from "@/lib/services/favorites";

export const metadata: Metadata = { title: "Favori Tariflerim" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requirePageUser();
  const items = await listFavorites(user.id);
  return (
    <>
      <PageHeader eyebrow="Koleksiyon" title="Favori tariflerim" description="Kaydettiğin tarifler ve şu anki malzemelerinle uyumları." />
      {items.length === 0 ? (
        <EmptyState icon={<Heart size={26} />} title="Henüz favori tarifin yok" description="Tarif kartlarındaki kalp simgesine dokunarak beğendiklerini buraya ekleyebilirsin."
          action={<ButtonLink href="/tarifler">Tariflere göz at</ButtonLink>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((x) => <RecipeCard key={x.recipe.id} recipe={x.recipe} match={x.match} isFavorite />)}
        </div>
      )}
    </>
  );
}

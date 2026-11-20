import Link from "next/link";
import { Clock, Leaf, Users } from "lucide-react";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import type { MatchSummary, RecipeSummary } from "@/lib/services/recipes";
import { cn } from "@/lib/cn";
import { CompatRing, ReadinessBadge } from "./compat";
import { FavoriteButton } from "./favorite-button";
import { RecipeImage } from "./recipe-image";

export function RecipeCard({ recipe, match, isFavorite, className, compact }: {
  recipe: RecipeSummary; match?: MatchSummary | null; isFavorite?: boolean; className?: string; compact?: boolean;
}) {
  return (
    <Link href={`/tarifler/${recipe.slug}`}
      className={cn("group card flex flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1", className)}>
      <div className={cn("relative", compact ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <RecipeImage emoji={recipe.emoji} title={recipe.title} categorySlug={recipe.categorySlug} imageUrl={recipe.imageUrl} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="chip bg-white/90 text-forest-800 backdrop-blur">{recipe.categoryName}</span>
          {recipe.isVegetarian && <span className="chip bg-white/90 text-forest-700 backdrop-blur" title="Vejetaryen"><Leaf size={12} /></span>}
        </div>
        {isFavorite !== undefined && <div className="absolute right-3 top-3"><FavoriteButton recipeId={recipe.id} initial={isFavorite} /></div>}
        {match && (
          <div className="absolute -bottom-6 right-4">
            <CompatRing value={match.compatibility} />
          </div>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col p-4", match && "pt-5")}>
        <h3 className="pr-14 font-display text-[17px] font-semibold leading-snug text-forest-900 group-hover:text-forest-700">{recipe.title}</h3>
        {!compact && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{recipe.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-500">
          <span className="inline-flex items-center gap-1"><Clock size={13} />{recipe.totalMinutes} dk</span>
          <span className="inline-flex items-center gap-1"><Users size={13} />{recipe.servings} kişilik</span>
          <span>{DIFFICULTY_LABELS[recipe.difficulty]}</span>
        </div>
        {match && (
          <div className="mt-auto pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <ReadinessBadge readiness={match.readiness} missingCount={match.missing.length} />
              {match.expiringUsed > 0 && <span className="chip bg-amber-50 text-amber-800">SKT yaklaşan {match.expiringUsed} ürün</span>}
              {match.allergenConflicts.length > 0 && <span className="chip bg-red-50 text-red-700">Alerjen uyarısı</span>}
            </div>
            {match.missing.length > 0 && (
              <p className="mt-2 line-clamp-1 text-xs text-ink-500"><span className="font-semibold text-ink-700">Eksik:</span> {match.missing.join(", ")}</p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

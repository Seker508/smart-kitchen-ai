import { RECIPE_CATEGORY_TINTS } from "@/lib/constants";
import { cn } from "@/lib/cn";

/**
 * Tarif görseli. Tarifte gerçek bir fotoğraf (imageUrl) tanımlıysa onu gösterir; yoksa kategoriye özel,
 * tutarlı bir illüstrasyon çizer. (Seed verisinde telifli/kaynağı belirsiz fotoğraf kullanılmamıştır.)
 */
export function RecipeImage({ emoji, title, categorySlug, imageUrl, className, size = "md" }: {
  emoji: string; title: string; categorySlug: string; imageUrl?: string | null; className?: string; size?: "sm" | "md" | "lg";
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={title} loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  }
  const t = RECIPE_CATEGORY_TINTS[categorySlug] ?? RECIPE_CATEGORY_TINTS["ana-yemek"];
  const plate = { sm: "h-16 w-16 text-3xl", md: "h-28 w-28 text-6xl", lg: "h-44 w-44 text-[96px] sm:h-56 sm:w-56 sm:text-[120px]" }[size];
  const id = `p-${categorySlug}`;
  return (
    <div role="img" aria-label={title} className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)} style={{ backgroundColor: t.bg }}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden>
        <defs>
          <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <path d="M6 14c3-5 9-5 12 0-3 5-9 5-12 0z" fill={t.ring} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      <div className={cn("relative flex items-center justify-center rounded-full shadow-[0_18px_40px_-16px_rgba(22,46,32,.45)] transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3", plate)}
        style={{ backgroundColor: t.plate, boxShadow: `0 0 0 10px ${t.plate}88, 0 18px 40px -16px rgba(22,46,32,.45)` }}>
        <span className="drop-shadow-sm" aria-hidden>{emoji}</span>
      </div>
    </div>
  );
}

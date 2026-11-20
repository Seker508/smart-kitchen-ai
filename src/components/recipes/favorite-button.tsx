"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

export function FavoriteButton({ recipeId, initial, variant = "icon", onChange }: { recipeId: number; initial: boolean; variant?: "icon" | "full"; onChange?: (v: boolean) => void }) {
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = !fav;
    setFav(next); // iyimser güncelleme
    setBusy(true);
    try {
      if (next) await api("/api/favorites", { body: { recipeId } });
      else await api(`/api/favorites/${recipeId}`, { method: "DELETE" });
      toast(next ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
      onChange?.(next);
    } catch (err) {
      setFav(!next);
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  if (variant === "full") {
    return (
      <button onClick={toggle} aria-pressed={fav} className={cn("inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-[15px] font-semibold transition active:scale-[.98]",
        fav ? "border-accent-100 bg-accent-50 text-accent-700" : "border-cream-300 bg-white text-forest-800 hover:bg-cream-50")}>
        <Heart size={18} className={cn("transition", fav && "fill-accent-500 text-accent-500")} />
        {fav ? "Favorilerde" : "Favorilere ekle"}
      </button>
    );
  }
  return (
    <button onClick={toggle} aria-pressed={fav} aria-label={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-sm backdrop-blur transition hover:scale-110 active:scale-95">
      <Heart size={17} className={cn("transition", fav && "fill-accent-500 text-accent-500")} />
    </button>
  );
}

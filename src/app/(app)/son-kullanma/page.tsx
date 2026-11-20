import type { Metadata } from "next";
import { AlertOctagon, CalendarClock, Hourglass, Leaf } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/states";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { requirePageUser } from "@/lib/auth/session";
import { getExpiryOverview } from "@/lib/services/dashboard";
import { expiryLabel } from "@/lib/expiry";
import { STORAGE_LABELS, UNIT_LABELS } from "@/lib/constants";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/cn";
import type { InventoryRow } from "@/lib/services/inventory";

export const metadata: Metadata = { title: "Son Kullanma Tarihi Takibi" };
export const dynamic = "force-dynamic";

function Group({ title, desc, items, tone, icon }: { title: string; desc: string; items: InventoryRow[]; tone: "red" | "orange" | "amber"; icon: React.ReactNode }) {
  const c = { red: ["bg-red-50 text-red-600", "bg-red-500", "bg-red-50 text-red-700"], orange: ["bg-accent-50 text-accent-600", "bg-accent-500", "bg-accent-50 text-accent-700"], amber: ["bg-amber-50 text-amber-700", "bg-amber-400", "bg-amber-50 text-amber-800"] }[tone];
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", c[0])}>{icon}</span>
        <div><h2 className="font-display text-lg font-semibold">{title} <span className="text-ink-400">({items.length})</span></h2><p className="text-sm text-ink-500">{desc}</p></div>
      </div>
      {items.length === 0 ? <p className="mt-4 rounded-2xl bg-cream-50 p-3 text-sm text-ink-500">Bu grupta ürün yok.</p> : (
        <ul className="mt-4 space-y-2">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-cream-50 px-3.5 py-2.5">
              <span className={cn("h-8 w-1.5 shrink-0 rounded-full", c[1])} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold capitalize">{i.name}</p>
                <p className="text-xs text-ink-500">{formatQuantity(i.quantity)} {UNIT_LABELS[i.unit]} · {STORAGE_LABELS[i.storage]}</p>
              </div>
              <span className={cn("chip shrink-0", c[2])}>{expiryLabel(i.expiresAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function Page() {
  const user = await requirePageUser();
  const { groups, recipes, totalTracked } = await getExpiryOverview(user.id);
  const nothing = !groups.expired.length && !groups.urgent.length && !groups.soon.length;
  return (
    <>
      <PageHeader eyebrow="Gıda israfını azaltma" title="Son kullanma tarihi takibi" description="Tarihi yaklaşan ürünlerini zamanında değerlendir. Bu ürünleri kullanan tarifler aşağıda önceliklendirilir." />
      {totalTracked === 0 ? (
        <EmptyState icon={<CalendarClock size={26} />} title="Takip edilen ürün yok" description="Envanterindeki ürünlere son kullanma tarihi eklediğinde burada takip edilir." action={<ButtonLink href="/envanter">Envantere git</ButtonLink>} />
      ) : (
        <>
          {nothing && <Notice tone="success" className="mb-6" icon={<Leaf size={18} />} title="Her şey yolunda">Önümüzdeki 7 gün içinde tarihi dolacak ürünün yok.</Notice>}
          <div className="grid gap-5 lg:grid-cols-3">
            <Group title="Öncelikli değerlendir" desc="Bugün ile 2 gün içinde son kullanma tarihi dolanlar." items={groups.urgent} tone="orange" icon={<AlertOctagon size={20} />} />
            <Group title="Son kullanma tarihi yaklaşanlar" desc="3–7 gün içinde tarihi dolacaklar." items={groups.soon} tone="amber" icon={<Hourglass size={20} />} />
            <Group title="Tarihi geçmiş ürünler" desc="Bu ürünler için tüketim önerisi yapılmaz. Kontrol edip gerekirse envanterden kaldır." items={groups.expired} tone="red" icon={<CalendarClock size={20} />} />
          </div>
          <section className="mt-10">
            <h2 className="mb-1 font-display text-2xl font-semibold">Bu ürünleri değerlendiren tarifler</h2>
            <p className="mb-5 text-sm text-ink-500">Tarihi yaklaşan ürünlerinden en çoğunu kullanan ve ana malzemesi eksik olmayan tarifler. Tarihi geçmiş ürünler hesaba katılmaz.</p>
            {recipes.length === 0 ? <p className="rounded-2xl bg-cream-50 p-4 text-sm text-ink-500">Yaklaşan ürünlerini kullanan uygun bir tarif bulunamadı.</p> : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recipes.map((x) => <RecipeCard key={x.recipe.id} recipe={x.recipe} match={x.match} />)}</div>
            )}
          </section>
        </>
      )}
    </>
  );
}

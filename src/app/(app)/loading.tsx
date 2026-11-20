import { SkeletonCards } from "@/components/ui/states";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Sayfa yükleniyor">
      <div className="skeleton h-10 w-72" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)}</div>
      <SkeletonCards className="mt-10" />
    </div>
  );
}

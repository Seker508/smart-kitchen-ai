import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Sayfalama">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} icon={<ChevronLeft size={16} />}>Önceki</Button>
      <span className="text-sm font-medium text-ink-500">Sayfa <b className="text-ink-900">{page}</b> / {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Sonraki<ChevronRight size={16} /></Button>
    </nav>
  );
}

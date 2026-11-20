import { cn } from "@/lib/cn";
import type { Readiness } from "@/lib/recommend";

export function compatColor(p: number) {
  return p >= 80 ? "#2F6142" : p >= 50 ? "#EA7A2E" : "#B4553D";
}

export function CompatRing({ value, size = 52, stroke = 5, className, label = true }: { value: number; size?: number; stroke?: number; className?: string; label?: boolean }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}
      role="img" aria-label={`Malzeme uyumu yüzde ${value}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EFE8D8" strokeWidth={stroke} fill="white" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={compatColor(value)} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      {label && <span className="absolute text-[13px] font-bold tabular-nums text-ink-900" style={{ fontSize: size < 48 ? 11 : 13 }}>%{value}</span>}
    </div>
  );
}

const readinessStyle: Record<Readiness, string> = {
  HAZIR: "bg-leaf-100 text-forest-800",
  MIKTAR_YETERSIZ: "bg-amber-50 text-amber-800",
  EKSIK_MALZEME: "bg-accent-50 text-accent-700",
  ANA_MALZEME_EKSIK: "bg-red-50 text-red-700",
};
const readinessText: Record<Readiness, string> = {
  HAZIR: "Hemen yapılabilir",
  MIKTAR_YETERSIZ: "Miktar az olabilir",
  EKSIK_MALZEME: "eksik",
  ANA_MALZEME_EKSIK: "Ana malzeme eksik",
};

export function ReadinessBadge({ readiness, missingCount, className }: { readiness: Readiness; missingCount: number; className?: string }) {
  const text = readiness === "EKSIK_MALZEME" ? `${missingCount} malzeme eksik` : readinessText[readiness];
  return <span className={cn("chip", readinessStyle[readiness], className)}>{text}</span>;
}

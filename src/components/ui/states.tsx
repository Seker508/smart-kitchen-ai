import type { ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-cream-50/60 px-6 py-12 text-center", className)}>
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100 text-forest-700">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-3xl border border-red-100 bg-red-50/70 px-6 py-10 text-center", className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600"><AlertTriangle size={22} /></div>
      <p className="max-w-md text-sm font-medium text-red-800">{message}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry} icon={<RotateCcw size={15} />}>Tekrar dene</Button>}
    </div>
  );
}

export function Notice({ tone = "info", title, children, className, icon }: { tone?: "info" | "warn" | "success" | "danger"; title?: string; children?: ReactNode; className?: string; icon?: ReactNode }) {
  const tones = {
    info: "border-forest-100 bg-forest-50 text-forest-900",
    warn: "border-accent-100 bg-accent-50 text-accent-700",
    success: "border-leaf-200 bg-leaf-50 text-forest-800",
    danger: "border-red-100 bg-red-50 text-red-800",
  };
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4 text-sm", tones[tone], className)} role={tone === "danger" ? "alert" : "status"}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

export function SkeletonCards({ n = 4, className }: { n?: number; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-4", className)} aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card overflow-hidden p-0">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-2.5 p-4"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton h-16" />)}
    </div>
  );
}

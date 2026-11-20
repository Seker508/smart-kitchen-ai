"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error" | "info";
interface ToastItem { id: number; tone: Tone; message: string }
const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-3), { id, tone, message }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), tone === "error" ? 6000 : 3800);
  }, []);
  const icons = { success: <CheckCircle2 size={18} />, error: <XCircle size={18} />, info: <Info size={18} /> };
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lift",
            t.tone === "success" && "bg-forest-800 text-white", t.tone === "error" && "bg-red-600 text-white", t.tone === "info" && "bg-ink-900 text-white")}>
            <span className="mt-0.5 shrink-0">{icons[t.tone]}</span>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))} aria-label="Kapat" className="opacity-70 hover:opacity-100"><X size={16} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

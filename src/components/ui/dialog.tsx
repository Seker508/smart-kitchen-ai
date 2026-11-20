"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input,button,select,textarea")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-forest-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} className="relative w-full max-w-md animate-fade-up rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-ink-400 hover:bg-cream-100" aria-label="Kapat"><X size={18} /></button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Sil", loading }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: ReactNode; confirmText?: string; loading?: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} footer={<>
      <Button variant="ghost" onClick={onClose}>Vazgeç</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmText}</Button>
    </>}>
      <p className="text-sm text-ink-600">{message}</p>
    </Dialog>
  );
}

import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#1E3F2B" />
      <path d="M20 38h24v4a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6v-4z" fill="#FBF7EE" />
      <path d="M32 34c-6-2-9-8-7-16 7 1 11 7 9 14" fill="#A9CD88" />
      <path d="M33 34c5-1 9-6 8-12-6 0-9 5-8 12z" fill="#EA7A2E" />
    </svg>
  );
}

export function Logo({ href = "/", light, className }: { href?: string; light?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label="Smart Kitchen AI ana sayfa">
      <LogoMark />
      <span className={cn("font-display text-[19px] font-semibold tracking-tight", light ? "text-white" : "text-forest-900")}>
        Smart Kitchen <span className="text-accent-500">AI</span>
      </span>
    </Link>
  );
}

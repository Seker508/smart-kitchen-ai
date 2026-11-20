import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-forest-800 text-white hover:bg-forest-700 shadow-sm",
  accent: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm shadow-accent-500/20",
  secondary: "bg-leaf-100 text-forest-800 hover:bg-leaf-200",
  outline: "border border-cream-300 bg-white text-forest-800 hover:border-forest-200 hover:bg-cream-50",
  ghost: "text-forest-700 hover:bg-forest-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-5 text-[15px] gap-2 rounded-2xl",
  lg: "h-13 px-7 text-base gap-2 rounded-2xl py-3.5",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn("inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 select-none whitespace-nowrap",
    variants[variant], sizes[size], className);

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant, size, loading, icon, className, children, disabled, type = "button", ...rest }, ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant, size, className, children, icon }: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode; icon?: ReactNode }) {
  return <Link href={href} className={buttonClass(variant, size, className)}>{icon}{children}</Link>;
}

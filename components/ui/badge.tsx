import { cn } from "@/lib/utils";

export function Badge(props: { children: React.ReactNode; className?: string; variant?: "default" | "outline" | "success" | "warning" | "destructive" }) {
  const base = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
  const variant =
    props.variant === "outline"
      ? "border border-border"
      : props.variant === "success"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : props.variant === "warning"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      : props.variant === "destructive"
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      : "bg-muted text-foreground";
  return <span className={cn(base, variant, props.className)}>{props.children}</span>;
}



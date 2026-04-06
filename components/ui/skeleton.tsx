import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-ds-xl bg-ds-elevated-soft", className)}
      aria-hidden
    />
  );
}

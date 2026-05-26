import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-ds-lg bg-ds-hairline", className)}
      aria-hidden
    />
  );
}

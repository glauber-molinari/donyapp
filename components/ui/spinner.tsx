import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SpinnerProps {
  className?: string;
  /** Texto para leitores de tela */
  label?: string;
}

export function Spinner({ className, label = "Carregando…" }: SpinnerProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-sm text-ds-muted", className)}
      role="status"
      aria-label={label}
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-app-primary" aria-hidden />
    </span>
  );
}

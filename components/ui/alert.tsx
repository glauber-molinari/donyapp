import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warn" | "danger" | "neutral";

const config: Record<
  AlertVariant,
  {
    container: string;
    icon: typeof Info;
    iconClass: string;
    role: "alert" | "status";
  }
> = {
  info: {
    container: "border-ds-info/20 bg-ds-info-soft text-ds-info",
    icon: Info,
    iconClass: "text-ds-info",
    role: "status",
  },
  success: {
    container: "border-ds-success/20 bg-ds-success-soft text-ds-success",
    icon: CheckCircle2,
    iconClass: "text-ds-success",
    role: "status",
  },
  warn: {
    container: "border-ds-warn/20 bg-ds-warn-soft text-ds-warn",
    icon: AlertTriangle,
    iconClass: "text-ds-warn",
    role: "status",
  },
  danger: {
    container: "border-ds-danger/20 bg-ds-danger-soft text-ds-danger",
    icon: AlertCircle,
    iconClass: "text-ds-danger",
    role: "alert",
  },
  neutral: {
    container: "border-ds-border bg-ds-cream text-ds-ink",
    icon: Info,
    iconClass: "text-ds-muted",
    role: "status",
  },
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  /** Oculta o ícone lateral */
  noIcon?: boolean;
}

export function Alert({
  variant = "neutral",
  title,
  children,
  onDismiss,
  className,
  noIcon = false,
}: AlertProps) {
  const { container, icon: Icon, iconClass, role } = config[variant];

  return (
    <div
      role={role}
      className={cn(
        "flex gap-3 rounded-ds-lg border px-4 py-3 text-sm",
        container,
        className
      )}
    >
      {!noIcon ? (
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} aria-hidden />
      ) : null}

      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div className={cn(title && "mt-0.5", "text-sm opacity-90")}>{children}</div>
        ) : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar"
          className="ml-auto mt-0.5 shrink-0 rounded-ds-md p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

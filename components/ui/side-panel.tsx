"use client";

import { X } from "lucide-react";
import { useEffect, useId } from "react";

import { cn } from "@/lib/utils";

// ─── Shared field primitives ──────────────────────────────────────────────────

export const panelInputCls =
  "w-full rounded-lg border border-ds-border bg-ds-cream px-3 py-2 text-sm text-ds-ink placeholder:text-ds-subtle focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20";

export const panelSelectCls =
  "w-full rounded-lg border border-ds-border bg-ds-cream px-3 py-2 text-sm text-ds-ink focus:border-ds-accent/50 focus:outline-none focus:ring-2 focus:ring-ds-accent/20 appearance-none";

export function PanelField({
  label,
  htmlFor,
  children,
  required,
  align = "center",
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  align?: "center" | "start";
}) {
  return (
    <div className={cn("flex gap-3", align === "start" ? "items-start" : "items-center")}>
      <label
        htmlFor={htmlFor}
        className="w-28 shrink-0 text-xs font-medium text-ds-muted"
      >
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function PanelFieldCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border border-ds-border bg-ds-cream/40 p-4", className)}>
      {children}
    </div>
  );
}

export type SidePanelSize = "sm" | "md" | "lg";

export interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  /** Simple string title. Use `headerContent` for custom header layout. */
  title?: string;
  /** Replaces the entire header row (title + close button). Use for custom headers. */
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: SidePanelSize;
  className?: string;
}

const widthClass: Record<SidePanelSize, string> = {
  sm: "sm:w-[400px]",
  md: "sm:w-[480px]",
  lg: "sm:w-[560px]",
};

export function SidePanel({
  open,
  onClose,
  title,
  headerContent,
  children,
  footer,
  size = "md",
  className,
}: SidePanelProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <button
          type="button"
          aria-label="Fechar"
          className="fixed inset-0 z-40 bg-ds-ink/10 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl",
          "w-full border-l border-ds-border",
          "transition-transform duration-200 ease-out",
          widthClass[size],
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ds-border px-5 py-3">
          {headerContent ?? (
            <>
              <h2 id={titleId} className="text-sm font-semibold text-ds-ink">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-ds-subtle hover:bg-ds-cream hover:text-ds-ink transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-ds-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

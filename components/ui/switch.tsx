"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

export function Switch({ id: idProp, checked, onChange, disabled, label, hint, className }: SwitchProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full",
          "transition-colors duration-ds-fast ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2",
          checked ? "bg-ds-accent" : "bg-ds-border",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-ds-sm",
            "transition-transform duration-ds-fast ease-out",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>

      {(label || hint) ? (
        <div className="min-w-0 flex-1">
          {label ? (
            <label
              htmlFor={id}
              className={cn("block text-sm font-medium text-ds-ink", disabled && "opacity-50")}
            >
              {label}
            </label>
          ) : null}
          {hint ? (
            <p id={hintId} className="mt-0.5 text-xs text-ds-muted">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

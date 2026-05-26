"use client";

import { Check, Minus } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  hint?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id: idProp, label, hint, error, indeterminate, disabled, className, ...rest }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    const describedBy = [
      hint && !error ? hintId : null,
      error ? errorId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={cn("flex items-start gap-2.5", className)}>
        <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            {...rest}
            className="peer sr-only"
          />
          {/* Custom box */}
          <span
            aria-hidden
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-ds-sm border",
              "transition-[border-color,background-color,box-shadow] duration-ds-fast ease-out",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ds-accent peer-focus-visible:ring-offset-1",
              error
                ? "border-ds-danger peer-checked:border-ds-danger peer-checked:bg-ds-danger"
                : "border-ds-border peer-checked:border-ds-accent peer-checked:bg-ds-accent",
              disabled && "opacity-50"
            )}
          >
            {indeterminate ? (
              <Minus className="h-3 w-3 text-white" strokeWidth={3} aria-hidden />
            ) : (
              <Check className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-ds-fast" aria-hidden />
            )}
          </span>
        </div>

        {(label || hint || error) ? (
          <div className="min-w-0 flex-1">
            {label ? (
              <label
                htmlFor={id}
                className={cn(
                  "block text-sm font-medium leading-none",
                  disabled ? "text-ds-muted cursor-not-allowed" : "text-ds-ink cursor-pointer"
                )}
              >
                {label}
              </label>
            ) : null}
            {hint && !error ? (
              <p id={hintId} className="mt-0.5 text-xs text-ds-muted">
                {hint}
              </p>
            ) : null}
            {error ? (
              <p id={errorId} className="mt-0.5 text-xs text-ds-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

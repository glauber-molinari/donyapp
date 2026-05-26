import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-ds-ink">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId ?? hintId}
          className={cn(
            "w-full rounded-ds-lg border border-ds-border bg-ds-surface px-3 py-2.5 text-sm text-ds-ink placeholder:text-ds-muted-2",
            "transition-[border-color,box-shadow] duration-ds-fast ease-out",
            "focus:border-ds-accent focus:outline-none focus:ring-2 focus:ring-[rgba(255,85,0,0.18)]",
            error &&
              "border-ds-danger focus:border-ds-danger focus:ring-[rgba(196,56,56,0.18)]",
            className
          )}
          {...props}
        />
        {hint && !error ? (
          <p id={hintId} className="text-xs text-ds-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-xs text-ds-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

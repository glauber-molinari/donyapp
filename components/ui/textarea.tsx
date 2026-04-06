import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  id: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 4, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-ds-ink">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full resize-y rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2.5 text-sm text-ds-ink shadow-sm placeholder:text-ds-subtle",
            "focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20",
            error && "border-red-200 focus:border-red-300 focus:ring-red-200/40",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

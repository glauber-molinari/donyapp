import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  id: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, disabled, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-ds-ink">
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full appearance-none rounded-ds-xl border border-app-border bg-app-sidebar px-3 py-2.5 text-sm text-ds-ink shadow-sm",
            "focus:border-app-primary/50 focus:outline-none focus:ring-2 focus:ring-app-primary/20",
            "disabled:cursor-not-allowed disabled:bg-ds-cream disabled:text-ds-subtle",
            error && "border-red-200 focus:border-red-300 focus:ring-red-200/40",
            className
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

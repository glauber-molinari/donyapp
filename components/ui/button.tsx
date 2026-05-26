import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ds-accent text-white hover:bg-[#e94c00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,85,0,0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-ds-cream disabled:opacity-60",
  secondary:
    "border border-ds-border bg-ds-surface text-ds-ink hover:bg-ds-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,85,0,0.18)] focus-visible:ring-offset-2 focus-visible:ring-offset-ds-cream disabled:opacity-60",
  ghost:
    "text-ds-muted hover:bg-ds-cream hover:text-ds-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,85,0,0.18)] focus-visible:ring-offset-2 focus-visible:ring-offset-ds-cream disabled:opacity-60",
  danger:
    "bg-ds-danger-soft text-ds-danger border border-ds-danger/20 hover:bg-ds-danger hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-danger/30 focus-visible:ring-offset-2 disabled:opacity-60",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-ds-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-ds-lg gap-2",
  lg: "h-11 px-5 text-base rounded-ds-lg gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-ds-fast ease-out",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

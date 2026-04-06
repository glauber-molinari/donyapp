import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-app-primary text-white shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas disabled:opacity-60",
  secondary:
    "border border-app-border bg-app-sidebar text-ds-ink shadow-sm hover:bg-ds-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas disabled:opacity-60",
  ghost:
    "text-ds-muted hover:bg-ds-cream hover:text-ds-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas disabled:opacity-60",
  danger:
    "border border-red-100 bg-red-50 text-red-800 shadow-sm hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:opacity-60",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-ds-xl gap-1.5",
  md: "h-10 px-4 text-sm rounded-ds-xl gap-2",
  lg: "h-11 px-5 text-base rounded-ds-xl gap-2",
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
          "inline-flex items-center justify-center font-medium transition-colors duration-ds ease-out",
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

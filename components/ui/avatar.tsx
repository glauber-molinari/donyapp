"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  const single = parts[0] ?? "?";
  return single.slice(0, 2).toUpperCase();
}

const sizeClass = {
  /** Alinha com ícones de navegação (h-5 w-5) na sidebar */
  xs: "h-5 w-5 text-[10px] leading-none",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export type AvatarSize = keyof typeof sizeClass;

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;
  const remoteSrc = typeof src === "string" && /^https?:\/\//i.test(src);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ds-cream font-medium text-ds-ink ring-1 ring-app-border",
        sizeClass[size],
        className
      )}
      title={name}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar dinâmico de terceiros
        <img
          src={src!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy={remoteSrc ? "no-referrer" : undefined}
          onError={() => setFailed(true)}
        />
      ) : (
        initialsFromName(name)
      )}
    </div>
  );
}
